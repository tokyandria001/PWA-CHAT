'use client';

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

import ProfileSection from '../components/ProfileSection';
import RoomsSection from '../components/RoomsSection';
import GallerySection from '../components/GallerySection';
import styles from './page.module.css';

type Room = {
  rawName: string;
  name: string;
  clientsCount: number;
};

type RoomsApiResponse = {
  success: boolean;
  metadata?: unknown;
  data: Record<string, { clients: Record<string, unknown> }>;
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

  // SOCKET.IO
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

    return () => {socket.disconnect();}
  }, []);

  // FETCH ROOMS
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
            b.clientsCount - a.clientsCount ||
            a.name.localeCompare(b.name)
        );

        setRooms(parsed);
      } catch (err) {
        console.error(err);
      }
    };

    fetchRooms();
    const interval = setInterval(fetchRooms, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // LOCAL STORAGE PROFIL
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

  const saveProfile = () => {
    try {
      localStorage.setItem('profile', JSON.stringify({ pseudo, photo }));
      alert('Profil sauvegardé !');
    } catch {
      alert('Impossible de sauvegarder le profil, quota dépassé.');
    }
  };

  // CAMERA & GALERIE
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
    } catch {
      alert('Impossible d’accéder à la caméra.');
    }
  };

  const takePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    setPreview(canvas.toDataURL('image/jpeg', 0.7));
  };

  const savePhoto = () => {
    if (!preview) return;
    setPhoto(preview);
    setPhotos(prev => [preview, ...prev].slice(0, 3));

    try {
      localStorage.setItem('profile', JSON.stringify({ pseudo, photo: preview }));
      localStorage.setItem('photos', JSON.stringify([preview, ...photos].slice(0, 3)));
    } catch {
      alert('Impossible de sauvegarder la photo, quota dépassé.');
    }

    closeCamera();
  };

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setIsCameraOpen(false);
    setPreview(null);
  };

  // IMPORT IMAGE
  const importImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (!reader.result) return;
      const imgData = reader.result as string;
      setPhoto(imgData);
      setPhotos(prev => [imgData, ...prev].slice(0, 3));

      try {
        localStorage.setItem('profile', JSON.stringify({ pseudo, photo: imgData }));
        localStorage.setItem('photos', JSON.stringify([imgData, ...photos].slice(0, 3)));
      } catch {
        alert('Impossible de sauvegarder l’image, quota dépassé.');
      }
    };
    reader.readAsDataURL(file);
  };

  // ENTREE DANS LA ROOM
  const connectToRoom = () => {
    if (!pseudo.trim()) return alert('Merci d’indiquer un pseudo.');
    if (!selectedRoom) return alert('Veuillez choisir une room.');

    localStorage.setItem('profile', JSON.stringify({ pseudo, photo }));
    router.push(`/room/${encodeURIComponent(selectedRoom)}`);
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
