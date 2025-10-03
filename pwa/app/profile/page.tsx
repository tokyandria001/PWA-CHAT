'use client';

import { useEffect, useState } from 'react';
import styles from '@/app/page.module.css';

interface UserProfile {
  pseudo: string;
  avatar?: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>({ pseudo: '', avatar: '' });
  const [saved, setSaved] = useState(false);
  const [editMode, setEditMode] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('userProfile');
    const lastPhoto = localStorage.getItem('lastTakenPhoto');

    if (stored) {
      const parsed = JSON.parse(stored);
      if (lastPhoto && parsed.avatar !== lastPhoto) {
        parsed.avatar = lastPhoto;
        localStorage.setItem('userProfile', JSON.stringify(parsed));
        localStorage.removeItem('lastTakenPhoto');
      }
      setProfile(parsed);
      if (parsed.pseudo && parsed.avatar) setEditMode(false);
    } else if (lastPhoto) {
      const newProfile = { pseudo: '', avatar: lastPhoto };
      setProfile(newProfile);
      localStorage.setItem('userProfile', JSON.stringify(newProfile));
      localStorage.removeItem('lastTakenPhoto');
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setProfile({ ...profile, avatar: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    localStorage.setItem('userProfile', JSON.stringify(profile));
    setSaved(true);
    setEditMode(false);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Mon Profil</h1>

      {editMode ? (
        <>
          <div className={styles.formGroup}>
            <label htmlFor="pseudo" className={styles.label}>
              Pseudo :
            </label>
            <input
              type="text"
              id="pseudo"
              name="pseudo"
              value={profile.pseudo}
              onChange={handleChange}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Photo de profil :</label>
            <div className={styles.avatarActions}>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className={styles.fileInput}
              />
              <button
                onClick={() => (window.location.href = '/camera')}
                className={styles.buttonCamera}
                type="button"
              >
                📷 Prendre une photo
              </button>
            </div>
          </div>

          {profile.avatar && (
            <div className={styles.avatarPreview}>
              <p>Aperçu :</p>
              <img
                src={profile.avatar}
                alt="Avatar"
                className={styles.avatarImage}
              />
            </div>
          )}

          <button onClick={handleSave} className={styles.buttonSave}>
            💾 Sauvegarder
          </button>

          {saved && (
            <p className={styles.success}>Profil enregistré localement.</p>
          )}
        </>
      ) : (
        profile.pseudo &&
        profile.avatar && (
          <div className={styles.profileWrapper}>
            <div className={styles.profileCard}>
              <div className={styles.profileAvatarContainer}>
                <img
                  src={profile.avatar}
                  alt="Avatar"
                  className={styles.profileAvatar}
                />
              </div>
              <div className={styles.profileContent}>
                <h2 className={styles.profileName}>{profile.pseudo}</h2>
                <p className={styles.profileTag}>
                  @{profile.pseudo.toLowerCase().replace(/\s/g, '')}
                </p>
                <button
                  onClick={() => setEditMode(true)}
                  className={styles.editButton}
                >
                  ✏️ Modifier
                </button>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
