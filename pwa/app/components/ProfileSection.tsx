'use client';

import Image from 'next/image';

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
    <section>
      <h2>Profil</h2>

      <input
        value={pseudo}
        onChange={e => onPseudoChange(e.target.value)}
        placeholder="Votre pseudo"
      />

      <input
        type="file"
        accept="image/*"
        onChange={onImportImage}
      />

      {photo && <Image alt="" src={photo} width={100} height={100} />}

      <button onClick={onSave}>💾 Sauvegarder</button>
    </section>
  );
}
