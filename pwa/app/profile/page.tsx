'use client';

import styles from './page.module.css';
import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

import ProfileSection from '../components/ProfileSection';
import RoomsSection from '../components/RoomsSection';
import GallerySection from '../components/GallerySection';

type ClientData = Record<string, unknown>;

type Room = {
  rawName: string;
  name: string;
  clientsCount: number;
};

type RoomData = {
  clients: ClientData;
};

type RoomsApiResponse = {
  success: boolean;
  metadata?: unknown;
  data: Record<string, RoomData>;
};

export default function Reception() {
  const router = useRouter();

  const [pseudo, setPseudo] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Socket.IO
  useEffect(() => {
    const socket = io('https://api.tools.gavago.fr/socketio/', {
      path: '/socketio',
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('get-rooms');
    });

    socket.on('rooms-list', (data: string[]) => {
      const parsed = data.map(r => ({
        rawName: r,
        name: decodeURIComponent(r),
        clientsCount: 0,
      }));
      setRooms(parsed);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Fetch rooms (HTTP)
  useEffect(() => {
    let mounted = true;

    const fetchRooms = async () => {
      try {
        const res = await fetch(
          'https://api.tools.gavago.fr/socketio/api/rooms',
          { cache: 'no-store' }
        );
        const json: RoomsApiResponse = await res.json();
        if (!mounted) return;

        const parsed = Object.keys(json.data).map(raw => ({
          rawName: raw,
          name: decodeURIComponent(raw),
          clientsCount: Object.keys(json.data[raw].clients).length,
        }));

        parsed.sort(
          (a, b) =>
            b.clientsCount - a.clientsCount || a.name.localeCompare(b.name)
        );

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

  // Profil & LocalStorage
  useEffect(() => {
    const storedProfile = localStorage.getItem('profile');
    if (storedProfile) {
      const parsed = JSON.parse(storedProfile);
      setPseudo(parsed.pseudo || '');
      setPhoto(parsed.photo || null);
    }
  }, []);

  const saveProfile = () => {
    localStorage.setItem('profile', JSON.stringify({ pseudo, photo }));
    alert('Profil sauvegardé !');
  };

  // Gestion caméra & galerie
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      });
      streamRef.current = stream;
      setIsCameraOpen(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
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
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    setPreview(canvas.toDataURL('image/png'));
  };

  const savePhoto = () => {
    if (!preview) return;
    setPhoto(preview);

    // Conserver seulement les 10 dernières images pour éviter quota
    const updated = [preview, ...photos].slice(0, 3);
    setPhotos(updated);

    localStorage.setItem('profile', JSON.stringify({ pseudo, photo: preview }));
    localStorage.setItem('photos', JSON.stringify(updated));

    closeCamera();
  };

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setIsCameraOpen(false);
    setPreview(null);
  };

  // Entrée dans un salon
  const connectToRoom = () => {
    if (!pseudo.trim()) return alert('Merci d’indiquer un pseudo.');
    if (!selectedRoom) return alert('Veuillez choisir une room.');

    localStorage.setItem('profile', JSON.stringify({ pseudo, photo }));
    router.push(`/room/${encodeURIComponent(selectedRoom)}`);
  };

  // Import depuis fichier
  const importImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const imgData = reader.result as string;
      setPhoto(imgData);

      setPhotos(prev => [imgData, ...prev].slice(0, 3));

      localStorage.setItem('profile', JSON.stringify({ pseudo, photo: imgData }));
    };
    reader.readAsDataURL(file);
  };

  
  return (
    <main className={styles.container}>
      <h1 className={styles.title}>Connexion</h1>

      <ProfileSection
        pseudo={pseudo}
        photo={photo}
        onPseudoChange={setPseudo}
        onSave={saveProfile}
        onImportImage={importImage}
      />

      <RoomsSection
        rooms={rooms}
        selectedRoom={selectedRoom}
        onSelectRoom={setSelectedRoom}
        onJoin={connectToRoom}
      />

      <GallerySection
        photos={photos}
        activePhoto={photo}
        isCameraOpen={isCameraOpen}
        preview={preview}
        videoRef={videoRef}
        onOpenCamera={openCamera}
        onCloseCamera={closeCamera}
        onTakePhoto={takePhoto}
        onSavePhoto={savePhoto}
        onSelectPhoto={setPhoto}
      />
    </main>
  );
}
