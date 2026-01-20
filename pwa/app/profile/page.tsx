'use client';

import styles from './page.module.css';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

type ClientData = Record<string, unknown>;

type Room = {
  rawName: string;
  name: string;
  clientsCount: number;
};

type RoomData = {
  clients: ClientData;
}

type RoomsApiResponse = {
  success: boolean;
  metadata?: unknown;
  data: Record<string, RoomData>;
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
    const socket = io('https://api.tools.gavago.fr/socketio/', { 
      path: '/socketio', 
      transports: ['websocket'],
    });

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
    if (!('Notification' in window)) return;

    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Permission notification:', permission);
      });
    }
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

        const parsed: Room[] = Object.keys(json.data || {}).map(raw => {
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

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('📸 Photo enregistrée', {
        body: 'La photo a été ajoutée à votre galerie',
        icon: preview,
      });
    }

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
    <main className={styles.container}>
      <h1 className={styles.title}>Connexion</h1>

      {/* Profil */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Profil</h2>

        <input
          value={pseudo}
          onChange={e => setPseudo(e.target.value)}
          placeholder="Votre pseudo"
          className={styles.input}
        />

        <input
          type="file"
          accept="image/*"
          onChange={importImage}
          className={styles.input}
        />

        {photo && <img src={photo} className={styles.avatar} />}

        <button onClick={saveProfile} className={styles.button}>
          💾 Sauvegarder
        </button>
      </section>

      {/* Rooms */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Salons</h2>

        <select
          value={selectedRoom}
          onChange={e => setSelectedRoom(e.target.value)}
          className={styles.input}
        >
          <option value="">-- Choisir une room --</option>
          {rooms.map(r => (
            <option key={r.rawName} value={r.name}>
              {r.name} ({r.clientsCount})
            </option>
          ))}
        </select>

        <button onClick={connectToRoom} className={styles.button}>
          🚀 Entrer
        </button>
      </section>

      {/* Galerie */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Galerie</h2>

        <button onClick={openCamera} className={styles.button}>
          📸 Prendre une photo
        </button>

        <div className={styles.gallery}>
          {photos.map((p, i) => (
            <img
              key={i}
              src={p}
              onClick={() => setPhoto(p)}
              className={`${styles.galleryImg} ${p === photo ? styles.galleryImgActive : ''
                }`}
            />
          ))}
        </div>
      </section>

      {/* Caméra */}
      {isCameraOpen && (
        <div className={styles.overlay}>
          <div className={styles.cameraBox}>
            {!preview ? (
              <>
                <video ref={videoRef} className={styles.video} muted />
                <button onClick={takePhoto} className={styles.button}>
                  📷 Capturer
                </button>
                <button onClick={closeCamera} className={styles.button}>
                  ❌ Annuler
                </button>
              </>
            ) : (
              <>
                <img src={preview} className={styles.video} />
                <button onClick={savePhoto} className={styles.button}>
                  ✅ Utiliser
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
