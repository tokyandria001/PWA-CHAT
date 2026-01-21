'use client';

type Room = {
  rawName: string;
  name: string;
  clientsCount: number;
};

type Props = {
  rooms: Room[];
  selectedRoom: string;
  onSelectRoom: (room: string) => void;
  onJoin: () => void;
};

export default function RoomsSection({
  rooms,
  selectedRoom,
  onSelectRoom,
  onJoin,
}: Props) {
  return (
    <section>
      <h2>Salons</h2>

      <select
        value={selectedRoom}
        onChange={e => onSelectRoom(e.target.value)}
      >
        <option value="">-- Choisir une room --</option>
        {rooms.map(r => (
          <option key={r.rawName} value={r.name}>
            {r.name} ({r.clientsCount})
          </option>
        ))}
      </select>

      <button onClick={onJoin}>🚀 Entrer</button>
    </section>
  );
}
