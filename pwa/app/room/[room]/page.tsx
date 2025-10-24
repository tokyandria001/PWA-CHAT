'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

type ChatMessage = {
  pseudo: string;
  content: string;
  dateEmis: string;
  roomName: string;
  categorie: 'MESSAGE' | 'INFO';
  serverId: string;
};

export default function RoomPage() {
  const router = useRouter();
  const params = useParams();
  const room = typeof params.room === 'string' ? params.room : 'general';

  const [pseudo, setPseudo] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  // Connexion Socket.IO
  useEffect(() => {
    const storedProfile = localStorage.getItem('profile');
    if (!storedProfile) {
      router.replace('/reception');
      return;
    }

    const parsed = JSON.parse(storedProfile);
    const userPseudo = parsed.pseudo || 'Anonyme';
    setPseudo(userPseudo);
    setPhoto(parsed.photo || null);

    const socket = io('https://api.tools.gavago.fr/socketio/', {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    // Rejoindre la room
    socket.emit('chat-join-room', {
      pseudo: userPseudo,
      roomName: room,
    });

    socket.on('connect', () => {
      console.log('✅ Connecté au serveur Gavago');
    });

    socket.on('chat-msg', (msg: ChatMessage) => {
      msg.dateEmis = new Date(msg.dateEmis).toLocaleTimeString();
      setMessages(prev => [...prev, msg]);
    });

    socket.on('chat-joined-room', (data: any) => {
      console.log(`👋 Nouvelle connexion dans ${data.roomName}`, data.clients);
      const infoMsg: ChatMessage = {
        pseudo: 'Serveur',
        content: `Un nouvel utilisateur a rejoint la room ${data.roomName}.`,
        dateEmis: new Date().toLocaleTimeString(),
        roomName: data.roomName,
        categorie: 'INFO',
        serverId: 'system',
      };
      setMessages(prev => [...prev, infoMsg]);
    });

    socket.on('chat-disconnected', (data: any) => {
      const infoMsg: ChatMessage = {
        pseudo: 'Serveur',
        content: `Un utilisateur s’est déconnecté.`,
        dateEmis: new Date().toLocaleTimeString(),
        roomName: data.roomName || room,
        categorie: 'INFO',
        serverId: 'system',
      };
      setMessages(prev => [...prev, infoMsg]);
    });

    socket.on('disconnect', () => {
      console.log('❌ Déconnecté du serveur Gavago');
    });

    return () => {
      socket.disconnect();
    };
  }, [router, room]);

  // Scroll automatique
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !socketRef.current || !pseudo) return;

    const message: ChatMessage = {
      pseudo,
      content: input.trim(),
      dateEmis: new Date().toISOString(),
      roomName: room,
      categorie: 'MESSAGE',
      serverId: 'clem_server',
    };

    socketRef.current.emit('chat-msg', message);
    setMessages(prev => [...prev, { ...message, dateEmis: new Date().toLocaleTimeString() }]);
    setInput('');
  };

  const handleLogout = () => {
    socketRef.current?.disconnect();
    localStorage.removeItem('profile');
    router.replace('/reception');
  };

  if (!pseudo) return <p>Chargement...</p>;

  return (
    <main className="container" style={{ maxWidth: 600, margin: '20px auto', fontFamily: 'Arial, sans-serif', position: 'relative' }}>
      <button
        onClick={handleLogout}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          backgroundColor: '#ff4d4f',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: 20,
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        Déconnexion
      </button>

      <h1 style={{ textAlign: 'center' }}>Salon : {room}</h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        {photo && (
          <img
            src={photo}
            alt="Votre photo"
            style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover', border: '2px solid #0070f3' }}
          />
        )}
        <p style={{ margin: 0, fontWeight: 'bold' }}>Bienvenue, {pseudo} !</p>
      </div>

      <div
        ref={chatRef}
        style={{
          border: '1px solid #ccc',
          borderRadius: 8,
          padding: 16,
          height: 400,
          overflowY: 'auto',
          backgroundColor: '#f9f9f9',
        }}
      >
        {messages.map((msg, index) => {
          const isMe = msg.pseudo === pseudo;
          return (
            <div
              key={index}
              style={{
                display: 'flex',
                flexDirection: isMe ? 'row-reverse' : 'row',
                alignItems: 'flex-end',
                marginBottom: 10,
              }}
            >
              {msg.categorie === 'MESSAGE' && photo && (
                <img
                  src={photo}
                  alt={msg.pseudo}
                  style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                />
              )}
              <div
                style={{
                  backgroundColor: msg.categorie === 'INFO'
                    ? '#ffeeba'
                    : isMe ? '#0070f3' : '#e5e5ea',
                  color: msg.categorie === 'INFO'
                    ? '#856404'
                    : isMe ? 'white' : 'black',
                  padding: '10px 14px',
                  borderRadius: 20,
                  maxWidth: '70%',
                }}
              >
                <strong>{msg.pseudo}</strong>
                <div>{msg.content}</div>
                <small style={{ opacity: 0.6 }}>{msg.dateEmis}</small>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Tapez votre message..."
          style={{
            flexGrow: 1,
            padding: '12px 16px',
            borderRadius: 24,
            border: '1px solid #ccc',
          }}
        />
        <button
          onClick={sendMessage}
          style={{
            padding: '12px 24px',
            borderRadius: 24,
            border: 'none',
            backgroundColor: '#0070f3',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          Envoyer
        </button>
      </div>
    </main>
  );
}
