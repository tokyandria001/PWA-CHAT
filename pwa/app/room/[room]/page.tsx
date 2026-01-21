'use client';

import styles from './room.module.css';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { DefaultEventsMap } from 'socket.io';

// Typage des messages
type Message = {
  pseudo: string;
  content?: string;
  image?: string | null;
  roomName: string;
  dateEmis?: string;
};

const getRoomStorageKey = (room: string) => `room-messages-${room}`;

export default function RoomPage() {
  const router = useRouter();
  const { room } = useParams();
  const roomParam = Array.isArray(room) ? room[0] : room;

  const [pseudo, setPseudo] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const socketRef = useRef<Socket<DefaultEventsMap, DefaultEventsMap> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isLeavingRef = useRef(false);

  // Scroll automatique
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Chargement du profil et messages
  useEffect(() => {
    if (!roomParam) return;

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
    if (!roomParam) return;

    const socket = io('https://api.tools.gavago.fr', { transports: ['websocket'], reconnection: false });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('chat-join-room', { pseudo, roomName: roomParam });
    });

    // Messages texte
    socket.on('chat-msg', (msg: Message) => {
      msg.dateEmis = new Date().toLocaleTimeString();
      setMessages(prev => {
        const updated = [...prev, msg].slice(-50);
        localStorage.setItem(getRoomStorageKey(roomParam), JSON.stringify(updated));
        return updated;
      });
    });

    // Messages avec image
    socket.on('image-sended', (msg: any) => {
      const newMsg: Message = {
        pseudo: msg.userId,
        image: msg.image,
        content: msg.content || undefined,
        roomName: msg.roomName,
        dateEmis: new Date(msg.dateEmis).toLocaleTimeString()
      };
      setMessages(prev => {
        const updated = [...prev, newMsg].slice(-50);
        localStorage.setItem(getRoomStorageKey(roomParam), JSON.stringify(updated));
        return updated;
      });
    });

    // Notification déconnexion
    socket.on('chat-disconnected', (options: { id: string; pseudo: string; roomName: string }) => {
      const disconnectMsg: Message = {
        pseudo: 'System',
        content: `${options.pseudo} a quitté le salon.`,
        roomName: options.roomName,
        dateEmis: new Date().toLocaleTimeString()
      };
      setMessages(prev => {
        const updated = [...prev, disconnectMsg].slice(-50);
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



  // Envoi message
  const sendMessage = async () => {
    if (!socketRef.current) return;

    if (!content.trim()) return;

    // Envoi via Socket.IO
    socketRef.current.emit('chat-msg', {
      pseudo,
      content: content.trim() || undefined,
      roomName: roomParam!
    });

    setContent('');
    setImageFile(null);
  };

  const leaveRoom = () => {
    isLeavingRef.current = true;
    socketRef.current?.disconnect();
    socketRef.current = null;
    router.push('/profile');
  };


  return (
    <main className={styles.container}>
      {!roomParam ? (
        <div>Room non spécifiée</div>
      ) : (
        <>
          <header className={styles.header}>
            <h2 className={styles.title}>Salon : {roomParam}</h2>
            <button onClick={leaveRoom} className={`${styles.button} ${styles.buttonDanger}`}>🚪 Quitter</button>
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
            <button onClick={sendMessage} className={`${styles.button} ${styles.buttonPrimary}`}>Envoyer</button>
          </div>
        </>
      )}
    </main>
  );
}
