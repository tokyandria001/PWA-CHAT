'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';

export default function CreateRoom() {
  const router = useRouter();
  const [newRoomName, setNewRoomName] = useState('');
  const [rooms, setRooms] = useState<string[]>([]);
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
      setRooms(data);
    });

    socket.on('room-created', (roomName: string) => {
      setRooms(prev => [...prev, roomName]);
      alert(`Salon "${decodeURIComponent(roomName)}" créé !`);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const createRoom = () => {
    if (!newRoomName.trim()) return alert('Veuillez saisir un nom de salon.');
    socketRef.current.emit('create-room', encodeURIComponent(newRoomName.trim()));
    setNewRoomName('');
  };

  const joinRoom = (room: string) => {
    router.push(`/room/${encodeURIComponent(room)}`);
  };

  return (
    <main className="container">
      <h1 className="title">Créer un salon</h1>

      <div className="formGroup">
        <input
          value={newRoomName}
          onChange={e => setNewRoomName(e.target.value)}
          placeholder="Nom du nouveau salon"
          className="input"
        />
        <button onClick={createRoom} className="button">➕ Créer</button>
      </div>

      <section className="formGroup">
        <h2 className="description">Salons existants</h2>
        {rooms.length === 0 ? (
          <p>Chargement des salons...</p>
        ) : (
          <ul>
            {rooms.map(r => (
              <li key={r} style={{ margin: '5px 0' }}>
                {decodeURIComponent(r)}{' '}
                <button onClick={() => joinRoom(r)} className="button">🚀 Rejoindre</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
