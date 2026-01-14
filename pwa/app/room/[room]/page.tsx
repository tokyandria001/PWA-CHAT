'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

type Message = {
  pseudo: string;
  content: string;
  roomName: string;
  dateEmis?: string;
};

const getRoomStorageKey = (room: string) => `room-messages-${room}`;

export default function RoomPage() {
  const { room } = useParams();
  const router = useRouter();
  const [pseudo, setPseudo] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isLeavingRef = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!room) return;

    const storedProfile = localStorage.getItem('profile');
    if (!storedProfile) {
      alert('Profil manquant, retour à la réception');
      router.replace('/profile');
      return;
    }
    const parsed = JSON.parse(storedProfile);
    setPseudo(parsed.pseudo || 'Anonyme');
    setPhoto(parsed.photo || null);

    const storedMessages = localStorage.getItem(getRoomStorageKey(room as string));
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    }

  }, [room, router]);

  useEffect(() => {
    if (!room) return;

    const socket = io('https://api.tools.gavago.fr', {
      transports: ['websocket'],
      reconnection: false,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Connecté au serveur Socket.IO :', socket.id);
      socket.emit('chat-join-room', { pseudo, roomName: room });
    });

    socket.on('connect_error', (err) => {
      if (!isLeavingRef.current) console.error('❌ Connect error :', err.message);
    });

    socket.on('chat-msg', (msg: Message) => {
      msg.dateEmis = new Date().toLocaleTimeString();
      setMessages(prev => {
        const updated = [...prev, msg];
        localStorage.setItem(
          getRoomStorageKey(room as string),
          JSON.stringify(updated)
        );
        return updated;
      });
    });

    return () => {
      isLeavingRef.current = true;
      socket.disconnect();
      socketRef.current = null;
    };
  }, [room, pseudo]);

  const sendMessage = () => {
    const trimmed = content.trim();
    if (!trimmed || !socketRef.current) return;
    const msg: Message = {
      pseudo,
      content: trimmed,
      roomName: room as string,
      dateEmis: new Date().toLocaleTimeString(),
    };

    socketRef.current.emit('chat-msg', msg);
    setMessages(prev => {
      const updated = [...prev, msg];
      localStorage.setItem(
        getRoomStorageKey(room as string),
        JSON.stringify(updated)
      );
      return updated;
    });
    setContent('');
  };

  const leaveRoom = () => {
    isLeavingRef.current = true;
    socketRef.current?.off();
    socketRef.current?.disconnect();
    socketRef.current = null;
    router.push('/profile');
  };

  return (
    <main className="container">
      <header className="flex justify-between items-center mb-4">
        <h2 className="title">Salon : {room}</h2>
        <button onClick={leaveRoom} className="button bg-red-600 hover:bg-red-700">🚪 Quitter</button>
      </header>

      <section className="messagesContainer">
        {messages.map((m, i) => {
          const isMine = m.pseudo === pseudo;
          return (
            <div
              key={i}
              className={`message ${isMine ? 'mine' : 'other'}`}
            >
              {isMine && photo && (
                <img src={photo} alt="profil" className="messagePhoto" />
              )}
              <div className="messageContent">
                <strong>{m.pseudo}</strong>
                <div>{m.content}</div>
                <small>{m.dateEmis}</small>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </section>

      <div className="formGroup flex gap-2 mt-3">
        <input
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Votre message..."
          className="input flex-grow"
        />
        <button onClick={sendMessage} className="button bg-blue-600 hover:bg-blue-700">📤 Envoyer</button>
      </div>
    </main>
  );
}
