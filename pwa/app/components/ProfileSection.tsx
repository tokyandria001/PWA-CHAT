'use client';

import Image from 'next/image';
import styles from './component.module.css';

type Props = {
  pseudo: string;
  photo: string | null;
  onPseudoChange: (v: string) => void;
  onImportImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
};

export default function ProfileSection({
  pseudo,
  photo,
  onPseudoChange,
  onImportImage,
  onSave,
}: Props) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Profil</h2>

      <div className={styles.photoBlock}>
        <div className={styles.avatarWrapper}>
          {photo ? (
            <Image
              src={photo}
              alt="Avatar"
              width={110}
              height={110}
              className={styles.avatar}
            />
          ) : (
            <div className={styles.avatarPlaceholder}>A</div>
          )}
        </div>

        <div className={styles.photoActions}>
          <input
            value={pseudo}
            onChange={e => onPseudoChange(e.target.value)}
            placeholder="Votre pseudo"
            className={styles.input}
          />

          <input
            type="file"
            accept="image/*"
            onChange={onImportImage}
            className={styles.input}
          />

          <button onClick={onSave} className={styles.button}>
            Sauvegarder
          </button>
        </div>
      </div>
    </section>
  );
}
