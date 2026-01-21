'use client';

import Image from 'next/image';
import { RefObject } from 'react';
import styles from './component.module.css';

type Props = {
  photos: string[];
  activePhoto: string | null;
  isCameraOpen: boolean;
  preview: string | null;
  videoRef: RefObject<HTMLVideoElement | null>;
  onOpenCamera: () => void;
  onCloseCamera: () => void;
  onTakePhoto: () => void;
  onSavePhoto: () => void;
  onSelectPhoto: (p: string) => void;
};

export default function GallerySection({
  photos,
  activePhoto,
  isCameraOpen,
  preview,
  videoRef,
  onOpenCamera,
  onCloseCamera,
  onTakePhoto,
  onSavePhoto,
  onSelectPhoto,
}: Props) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Galerie</h2>

      <button onClick={onOpenCamera} className={styles.button}>
        Prendre une photo
      </button>

      <div className={styles.gallery}>
        {photos.map((p, i) => (
          <Image
            key={i}
            src={p}
            alt="photo utilisateur"
            width={64}
            height={64}
            onClick={() => onSelectPhoto(p)}
            className={`${styles.galleryImg} ${
              p === activePhoto ? styles.galleryImgActive : ''
            }`}
          />
        ))}
      </div>

      {isCameraOpen && (
        <div className={styles.overlay}>
          <div className={styles.cameraBox}>
            {!preview ? (
              <>
                <video ref={videoRef} className={styles.video} autoPlay muted />
                <button onClick={onTakePhoto} className={styles.button}>
                  Capturer
                </button>
                <button onClick={onCloseCamera} className={styles.button}>
                  ❌ Annuler
                </button>
              </>
            ) : (
              <>
                <Image src={preview} alt="aperçu" width={300} height={200} className={styles.video} />
                <button onClick={onSavePhoto} className={styles.button}>
                  Utiliser
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
