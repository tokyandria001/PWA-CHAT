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

export default function RoomPage() {
  const { room } = useParams();
  const router = useRouter();
  const [pseudo, setPseudo] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll automatique
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Connexion socket
  useEffect(() => {
    const storedProfile = localStorage.getItem('profile');
    if (!storedProfile) {
      alert('Profil manquant, retour à la réception');
      router.replace('/profile');
      return;
    }
    const parsed = JSON.parse(storedProfile);
    setPseudo(parsed.pseudo || 'Anonyme');
    setPhoto(parsed.photo || null);

    const socket = io('https://api.tools.gavago.fr', {
      transports: ['websocket'],
      reconnection: false,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Connecté au serveur Socket.IO :', socket.id);
      socket.emit('chat-join-room', { pseudo: parsed.pseudo, roomName: room });
    });

    socket.on('connect_error', (err) => {
      if (!isLeavingRef.current) console.error('❌ Connect error :', err.message);
    });

    socket.on('chat-msg', (msg: Message) => {
      msg.dateEmis = new Date().toLocaleTimeString();
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      isLeavingRef.current = true; // Indique que c’est volontaire
      socket.disconnect();
      socketRef.current = null;
    };
  }, [room, router]);

  const sendMessage = () => {
    const trimmed = content.trim();
    if (!trimmed || !socketRef.current) return;

    socketRef.current.emit('chat-msg', {
      pseudo,
      content: trimmed,
      roomName: room as string,
    });

    setContent('');
  };

  const isLeavingRef = useRef(false);

  const leaveRoom = () => {
    socketRef.current?.off();
    socketRef.current?.disconnect();
    socketRef.current = null;
    router.push('/profile');
  };

  return (
    <main style={{ padding: '1rem', maxWidth: 700, margin: '0 auto', fontFamily: 'Segoe UI, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ color: '#0070f3' }}>Salon : {room}</h2>
        <button
          onClick={leaveRoom}
          style={{ padding: '8px 16px', border: 'none', borderRadius: 8, backgroundColor: '#c62828', color: 'white', cursor: 'pointer' }}
        >
          🚪 Quitter
        </button>
      </header>

      <section
        style={{ border: '1px solid #ccc', borderRadius: 8, padding: '1rem', height: '60vh', overflowY: 'auto', backgroundColor: '#f9f9f9', display: 'flex', flexDirection: 'column' }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.pseudo === pseudo ? 'flex-end' : 'flex-start',
              backgroundColor: m.pseudo === pseudo ? '#0070f3' : '#e5e5ea',
              color: m.pseudo === pseudo ? '#fff' : '#000',
              borderRadius: 12,
              padding: '8px 12px',
              margin: '4px 0',
              maxWidth: '75%',
            }}
          >
            <strong>{m.pseudo}</strong>
            <div>{m.content}</div>
            <small style={{ fontSize: 10, opacity: 0.7 }}>{m.dateEmis}</small>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </section>

      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <input
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Votre message..."
          style={{ flex: 1, padding: '12px 16px', borderRadius: 8, border: '1px solid #ccc', fontSize: 16 }}
        />
        <button
          onClick={sendMessage}
          style={{ padding: '12px 16px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}
        >
          📤 Envoyer
        </button>
      </div>
    </main>
  );
}
