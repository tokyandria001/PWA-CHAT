'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';

type Room = {
  rawName: string;
  name: string;
  clientsCount: number;
};

type RoomsApiResponse = {
  success: boolean;
  metadata?: any;
  data: Record<string, { clients: Record<string, any> }>;
};

export default function Reception() {
  const router = useRouter();
  const [pseudo, setPseudo] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    const socket = io('https://api.tools.gavago.fr/socketio/', { path: '/socketio', transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Connecté à Socket.IO', socket.id);
      socket.emit('get-rooms');
    });

    socket.on('rooms-list', (data: string[]) => {
      const parsed = Array.isArray(data)
        ? data.map(r => ({ rawName: r, name: decodeURIComponent(r), clientsCount: 0 }))
        : [];
      setRooms(parsed);
    });

    return () => { socket.disconnect() };
  }, []);

  useEffect(() => {
    const storedProfile = localStorage.getItem('profile');
    if (storedProfile) {
      const parsed = JSON.parse(storedProfile);
      setPseudo(parsed.pseudo || '');
      setPhoto(parsed.photo || null);
    }

    const storedPhotos = localStorage.getItem('photos');
    if (storedPhotos) setPhotos(JSON.parse(storedPhotos));
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchRooms = async () => {
      try {
        const res = await fetch('https://api.tools.gavago.fr/socketio/api/rooms', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: RoomsApiResponse = await res.json();
        if (!mounted) return;

        const parsed = Object.keys(json.data || {}).map(raw => {
          let decoded = raw;
          try { decoded = decodeURIComponent(raw); } catch {}
          const clientsCount = Object.keys(json.data[raw].clients || {}).length;
          return { rawName: raw, name: decoded, clientsCount };
        });

        parsed.sort((a, b) => b.clientsCount - a.clientsCount || a.name.localeCompare(b.name));
        setRooms(parsed);
      } catch (err) {
        console.error('Erreur fetch rooms', err);
      }
    };

    fetchRooms();
    const interval = setInterval(fetchRooms, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const saveProfile = () => {
    localStorage.setItem('profile', JSON.stringify({ pseudo, photo }));
    alert('Profil sauvegardé !');
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      setIsCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.error);
        }
      }, 100);
    } catch (err) {
      alert('Impossible d’accéder à la caméra.');
      console.error(err);
    }
  };

  const takePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    setPreview(canvas.toDataURL('image/png'));
  };

  const savePhoto = () => {
    if (!preview) return;
    setPhoto(preview);
    const updated = [preview, ...photos];
    setPhotos(updated);
    localStorage.setItem('profile', JSON.stringify({ pseudo, photo: preview }));
    localStorage.setItem('photos', JSON.stringify(updated));
    setPreview(null);
    closeCamera();
  };

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setIsCameraOpen(false);
    setPreview(null);
  };

  const clearGallery = () => {
    if (confirm('Supprimer toutes les photos ?')) {
      localStorage.removeItem('photos');
      setPhotos([]);
    }
  };

  const connectToRoom = () => {
    if (!pseudo.trim()) return alert('Merci d’indiquer un pseudo.');
    if (!selectedRoom) return alert('Veuillez choisir une room.');
    localStorage.setItem('profile', JSON.stringify({ pseudo, photo }));
    router.push(`/room/${encodeURIComponent(selectedRoom)}`);
  };

  const importImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const imgData = reader.result as string;
      setPhoto(imgData);
      const updated = [imgData, ...photos];
      setPhotos(updated);
      localStorage.setItem('profile', JSON.stringify({ pseudo, photo: imgData }));
      localStorage.setItem('photos', JSON.stringify(updated));
    };
    reader.readAsDataURL(file);
  };

  const selectPhotoAsProfile = (img: string) => {
    setPhoto(img);
    localStorage.setItem('profile', JSON.stringify({ pseudo, photo: img }));
  };

  return (
    <main className="container">
      <h1 className="title">Connexion</h1>

      {/* Profil */}
      <div className="formGroup">
        <input
          value={pseudo}
          onChange={e => setPseudo(e.target.value)}
          placeholder="Votre pseudo"
          className="input"
        />
      </div>

      <div className="buttonGroup">
        <button onClick={openCamera} className="button">📸 Prendre une photo</button>
        <input type="file" accept="image/*" onChange={importImage} className="input" />
        {photo && (
          <img
            src={photo}
            alt="profil"
            className="image"
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              border: '3px solid #1a73e8',
              objectFit: 'cover',
            }}
          />
        )}
      </div>

      <div className="buttonGroup">
        <button onClick={saveProfile} className="button">💾 Sauvegarder profil</button>
      </div>

      {/* Rooms */}
      <section className="formGroup">
        <h2 className="description">Rooms disponibles</h2>
        {rooms.length === 0 ? (
          <p>Chargement des rooms...</p>
        ) : (
          <div className="buttonGroup">
            <select
              value={selectedRoom}
              onChange={e => setSelectedRoom(e.target.value)}
              className="input"
            >
              <option value="">-- Choisissez une room --</option>
              {rooms.map(r => (
                <option key={r.rawName} value={r.name}>
                  {r.name} ({r.clientsCount})
                </option>
              ))}
            </select>
            <button onClick={connectToRoom} className="button">🚀 Entrer</button>
          </div>
        )}
      </section>

      {/* Galerie */}
      <section>
        <h2 className="description">🖼️ Galerie</h2>
        {photos.length === 0 ? (
          <p>Aucune photo enregistrée.</p>
        ) : (
          <div className="gallery">
            {photos.map((p, i) => (
              <img
                key={i}
                src={p}
                alt={`photo-${i}`}
                onClick={() => selectPhotoAsProfile(p)}
                style={{
                  cursor: 'pointer',
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  border: p === photo ? '3px solid #1a73e8' : '2px solid #ccc',
                  objectFit: 'cover',
                  margin: 5,
                }}
              />
            ))}
          </div>
        )}
        {photos.length > 0 && (
          <div className="buttonGroup">
            <button onClick={clearGallery} className="button">🗑️ Vider la galerie</button>
          </div>
        )}
      </section>

      {/* Caméra */}
      {isCameraOpen && (
        <div className="videoContainer">
          {!preview ? (
            <>
              <video ref={videoRef} className="video" autoPlay playsInline muted />
              <div className="buttonGroup">
                <button onClick={takePhoto} className="button">📷 Capturer</button>
                <button onClick={closeCamera} className="button">❌ Annuler</button>
              </div>
            </>
          ) : (
            <>
              <img src={preview} alt="Aperçu" className="image" />
              <div className="buttonGroup">
                <button onClick={savePhoto} className="button">✅ Utiliser</button>
                <button onClick={() => setPreview(null)} className="button">🔄 Reprendre</button>
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}
