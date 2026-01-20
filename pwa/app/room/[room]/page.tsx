'use client';

import styles from './room.module.css';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { DefaultEventsMap } from 'socket.io';

type Message = {
  pseudo: string;
  content?: string;
  imageId?: string;
  image?: string | null;
  roomName: string;
  dateEmis?: string;
};

const getRoomStorageKey = (room: string) => `room-messages-${room}`;

export default function RoomPage() {
  const router = useRouter();

  const [pseudo, setPseudo] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const socketRef = useRef<Socket<DefaultEventsMap, DefaultEventsMap> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isLeavingRef = useRef(false);

  const { room } = useParams();

  const roomParam = Array.isArray(room) ? room[0] : room;

  if (!roomParam) return <div>Room non spécifiée</div>;

  // Scroll automatique
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Chargement du profil et messages
  useEffect(() => {
    const storedProfile = localStorage.getItem('profile');
    if (!storedProfile) {
      alert('Profil manquant, retour à la réception');
      router.replace('/profile');
      return;
    }

    const parsed: { pseudo?: string; photo?: string | null } = JSON.parse(storedProfile);
    setPseudo(parsed.pseudo ?? 'Anonyme');
    setPhoto(parsed.photo ?? null);

    const storedMessages = localStorage.getItem(getRoomStorageKey(roomParam));
    if (storedMessages) setMessages(JSON.parse(storedMessages) as Message[]);
  }, [roomParam, router]);

  // Connexion Socket.IO
  useEffect(() => {
    const socket: Socket<DefaultEventsMap, DefaultEventsMap> = io('https://api.tools.gavago.fr', {
      transports: ['websocket'],
      reconnection: false,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socketRef.current?.emit('chat-join-room', { pseudo, roomName: roomParam });
    });

    socket.on('chat-msg', async (msg: Message) => {
      msg.dateEmis = new Date().toLocaleTimeString();

      if (msg.imageId) {
        const image = await fetchImageById(msg.imageId);
        if (image) msg.image = image;
      }

      setMessages(prev => {
        const updated = [...prev, msg].slice(-50);
        localStorage.setItem(getRoomStorageKey(roomParam), JSON.stringify(updated));
        return updated;
      });
    });

    socket.on('connect_error', err => {
      if (!isLeavingRef.current) console.error('Connect error:', (err as Error).message);
    });

    return () => {
      isLeavingRef.current = true;
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomParam, pseudo]);

  // Convertir fichier en base64
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // Upload image
  const uploadImage = async (file: File): Promise<string | null> => {
    if (!socketRef.current) return null;
    const imageBase64 = await fileToBase64(file);

    try {
      const res = await fetch('https://api.tools.gavago.fr/socketio/api/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: socketRef.current.id, image_data: imageBase64 }),
      });
      const json: { success: boolean; [key: string]: unknown } = await res.json();
      return json.success ? socketRef.current.id ?? null : null;
    } catch {
      return null;
    }
  };

  // Récupérer image par ID
  const fetchImageById = async (id: string): Promise<string | null> => {
    try {
      const res = await fetch(`https://api.tools.gavago.fr/socketio/api/images/${id}`);
      const json: { success: boolean; data_image?: string } = await res.json();
      return json.success ? json.data_image ?? null : null;
    } catch {
      return null;
    }
  };

  // Envoyer un message
  const sendMessage = async () => {
    if (!socketRef.current) return;

    let imageId: string | undefined;
    if (imageFile) {
      const uploadedId = await uploadImage(imageFile);
      if (!uploadedId) return alert("Erreur d'envoi de l'image");
      imageId = uploadedId;
    }

    if (!content.trim() && !imageId) return;

    socketRef.current.emit('chat-msg', {
      pseudo,
      content: content.trim() || undefined,
      imageId,
      roomName: roomParam,
    });

    setContent('');
    setImageFile(null);
  };

  // Quitter la room
  const leaveRoom = () => {
    isLeavingRef.current = true;
    socketRef.current?.disconnect();
    socketRef.current = null;
    router.push('/profile');
  };

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Salon : {roomParam}</h2>
        <button onClick={leaveRoom} className={`${styles.button} ${styles.buttonDanger}`}>
          🚪 Quitter
        </button>
      </header>

      <section className={styles.messagesContainer}>
        {messages.map((m, i) => {
          const isMine = m.pseudo === pseudo;
          return (
            <div key={i} className={`${styles.message} ${isMine ? styles.mine : styles.other}`}>
              {isMine && photo && <img src={photo} alt="profil" className={styles.messagePhoto} />}
              <div className={styles.messageContent}>
                <strong>{m.pseudo}</strong>
                {m.content && <div>{m.content}</div>}
                {m.image && <img src={m.image} alt="image envoyée" className={styles.messageImage} />}
                <small className={styles.messageDate}>{m.dateEmis}</small>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </section>

      <div className={styles.formGroup}>
        <input
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Votre message..."
          className={styles.input}
        />
        <input
          type="file"
          accept="image/*"
          onChange={e => e.target.files && setImageFile(e.target.files[0])}
          className={styles.fileInput}
        />
        <button onClick={sendMessage} className={`${styles.button} ${styles.buttonPrimary}`}>
          📤 Envoyer
        </button>
      </div>
    </main>
  );
}
