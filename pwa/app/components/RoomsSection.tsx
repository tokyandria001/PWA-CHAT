'use client';
import styles from './component.module.css';

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
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Salons</h2>

      <select
        value={selectedRoom}
        onChange={e => onSelectRoom(e.target.value)}
        className={styles.roomSelect}
      >
        <option value="">-- Choisir une room --</option>
        {rooms.map(r => (
          <option key={r.rawName} value={r.name}>
            {r.name} ({r.clientsCount})
          </option>
        ))}
      </select>

      <button onClick={onJoin} className={styles.button}>
        Entrer
      </button>
    </section>
  );
}
