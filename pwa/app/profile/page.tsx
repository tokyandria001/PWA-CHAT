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

  // Récupérer rooms depuis API
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
          try {
            decoded = decodeURIComponent(raw);
          } catch { }
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

  // Caméra
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
    localStorage.setItem('photo', preview);
    localStorage.setItem('profile', JSON.stringify({ pseudo, photo: preview }));
    const updated = [preview, ...photos];
    setPhotos(updated);
    localStorage.setItem('photos', JSON.stringify(updated));
    window.dispatchEvent(new Event('photo-taken'));
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

  return (
    <main style={{ padding: '2rem', maxWidth: 800, margin: '0 auto', fontFamily: 'Segoe UI, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#0070f3' }}>Connexion</h1>

      {/* Profil */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        <input
          value={pseudo}
          onChange={e => setPseudo(e.target.value)}
          placeholder="Votre pseudo"
          style={{ padding: '12px 16px', borderRadius: 8, border: '1px solid #ccc', fontSize: 16 }}
        />
        <button
          onClick={openCamera}
          style={{
            padding: '12px 16px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer'
          }}
        >
          📸 Prendre une photo
        </button>
        {photo && (
          <img
            src={photo}
            alt="profil"
            style={{ width: 120, height: 120, borderRadius: '50%', border: '2px solid #0070f3' }}
          />
        )}
        <button
          onClick={saveProfile}
          style={{
            padding: '12px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: 8
          }}
        >
          💾 Sauvegarder profil
        </button>
      </div>

      {/* Liste déroulante des rooms */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#0070f3' }}>Rooms disponibles</h2>
        {rooms.length === 0 ? (
          <p>Chargement des rooms...</p>
        ) : (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <select
              value={selectedRoom}
              onChange={e => setSelectedRoom(e.target.value)}
              style={{
                flexGrow: 1,
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid #ccc',
                fontSize: 16
              }}
            >
              <option value="">-- Choisissez une room --</option>
              {rooms.map(r => (
                <option key={r.rawName} value={r.name}>
                  {r.name} ({r.clientsCount})
                </option>
              ))}
            </select>
            <button
              onClick={connectToRoom}
              style={{
                padding: '12px 20px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: '#0070f3',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              🚀 Entrer
            </button>
          </div>
        )}
      </section>

      {/* Galerie */}
      <section>
        <h2 style={{ color: '#0070f3' }}>🖼️ Galerie</h2>
        {photos.length === 0 ? (
          <p>Aucune photo enregistrée.</p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: 10,
              marginTop: 10
            }}
          >
            {photos.map((p, i) => (
              <img key={i} src={p} alt={`photo-${i}`} style={{ width: '100%', borderRadius: 10, objectFit: 'cover' }} />
            ))}
          </div>
        )}
        {photos.length > 0 && (
          <button
            onClick={clearGallery}
            style={{
              marginTop: 10,
              backgroundColor: '#c62828',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: 5
            }}
          >
            🗑️ Vider la galerie
          </button>
        )}
      </section>

      {/* Caméra */}
      {isCameraOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '1rem'
          }}
        >
          {!preview ? (
            <>
              <div
                style={{
                  width: '100%',
                  maxWidth: 400,
                  aspectRatio: '1 / 1',
                  border: '2px solid #0070f3',
                  borderRadius: 12,
                  overflow: 'hidden',
                  backgroundColor: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} autoPlay playsInline muted />
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
                <button
                  onClick={takePhoto}
                  style={{ padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: '#0070f3', color: 'white' }}
                >
                  📷 Capturer
                </button>
                <button
                  onClick={closeCamera}
                  style={{ padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: '#c62828', color: 'white' }}
                >
                  ❌ Annuler
                </button>
              </div>
            </>
          ) : (
            <>
              <img src={preview} alt="Aperçu" style={{ width: '100%', maxWidth: 400, borderRadius: 12 }} />
              <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
                <button
                  onClick={savePhoto}
                  style={{ padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: '#28a745', color: 'white' }}
                >
                  ✅ Utiliser
                </button>
                <button
                  onClick={() => setPreview(null)}
                  style={{ padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: '#f57c00', color: 'white' }}
                >
                  🔄 Reprendre
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}
