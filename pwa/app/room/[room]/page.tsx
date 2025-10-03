'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

type Message = {
    id: string;
    username: string;
    content: string;
    timestamp: number;
};

export default function RoomPage() {
    const router = useRouter();
    const params = useParams();
    const room = params.room;

    const [username, setUsername] = useState<string | null>(null);
    const [photo, setPhoto] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const ws = useRef<WebSocket | null>(null);

    const chatWindowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const storedUsername = sessionStorage.getItem('username');
        const storedPhoto = sessionStorage.getItem('photo');

        if (!storedUsername || !storedPhoto) {
            router.replace('/reception');
            return;
        }
        setUsername(storedUsername);
        setPhoto(storedPhoto);

        const socketUrl = `ws://localhost:8080?room=${room}&username=${storedUsername}`;
        ws.current = new WebSocket(socketUrl);

        ws.current.onopen = () => {
            console.log('Connecté au serveur WebSocket');
        };

        ws.current.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data) as Message;
                setMessages(prev => [...prev, data]);
            } catch (error) {
                console.error('Erreur parsing message WS:', error);
            }
        };

        ws.current.onclose = (event) => {
            console.log('Déconnecté du serveur WebSocket', event);
        };

        return () => {
            ws.current?.close();
        };
    }, [router, room]);

    useEffect(() => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = () => {
        if (input.trim() === '' || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;

        const message: Message = {
            id: uuidv4(), // id unique ici
            username: username!,
            content: input.trim(),
            timestamp: Date.now(),
        };

        ws.current.send(JSON.stringify(message));
        setMessages(prev => [...prev, message]);
        setInput('');
    };

    const handleLogout = () => {
        ws.current?.close();
        sessionStorage.removeItem('username');
        sessionStorage.removeItem('photo');
        router.replace('/profile');
    };

    if (!username || !photo) return <p>Chargement...</p>;

    return (
        <main className="container" style={{ maxWidth: 600, margin: '20px auto', fontFamily: 'Arial, sans-serif', position: 'relative' }}>
            {/* Bouton déconnexion */}
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
                    boxShadow: '0 2px 6px rgba(255,77,79,0.5)',
                    transition: 'background-color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#d9363e')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#ff4d4f')}
            >
                Déconnexion
            </button>

            <h1 style={{ textAlign: 'center' }}>Salon : {room}</h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <img
                    src={photo}
                    alt="Votre photo"
                    style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover', border: '2px solid #0070f3' }}
                />
                <p style={{ margin: 0, fontWeight: 'bold' }}>Bienvenue, {username} !</p>
            </div>

            <div
                ref={chatWindowRef}
                className="chatWindow"
                style={{
                    border: '1px solid #ccc',
                    borderRadius: 8,
                    padding: 16,
                    height: 400,
                    overflowY: 'auto',
                    backgroundColor: '#f9f9f9',
                    boxShadow: '0 0 8px rgba(0,0,0,0.05)',
                }}
            >
                {messages.map(msg => {
                    const isMe = msg.username === username;
                    return (
                        <div
                            key={msg.id}
                            style={{
                                display: 'flex',
                                marginBottom: 12,
                                flexDirection: isMe ? 'row-reverse' : 'row',
                                alignItems: 'flex-end',
                                gap: 8,
                            }}
                        >
                            <img
                                src={photo}
                                alt={msg.username}
                                style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                            />

                            <div
                                style={{
                                    maxWidth: '70%',
                                    backgroundColor: isMe ? '#0070f3' : '#e5e5ea',
                                    color: isMe ? 'white' : 'black',
                                    padding: '10px 14px',
                                    borderRadius: 20,
                                    borderTopRightRadius: isMe ? 0 : 20,
                                    borderTopLeftRadius: isMe ? 20 : 0,
                                    wordBreak: 'break-word',
                                }}
                            >
                                <div style={{ fontWeight: '600', fontSize: 14, marginBottom: 4 }}>
                                    {msg.username}
                                </div>
                                <div style={{ fontSize: 16 }}>{msg.content}</div>
                                <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: 'right' }}>
                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div
                style={{
                    marginTop: 16,
                    display: 'flex',
                    gap: 8,
                    justifyContent: 'center',
                }}
            >
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Tapez votre message..."
                    style={{
                        flexGrow: 1,
                        padding: '12px 16px',
                        borderRadius: 24,
                        border: '1px solid #ccc',
                        fontSize: 16,
                        outline: 'none',
                        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            sendMessage();
                        }
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
                        boxShadow: '0 2px 8px rgba(0,112,243,0.4)',
                        transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#005bb5')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#0070f3')}
                >
                    Envoyer
                </button>
            </div>
        </main>
    );
}
