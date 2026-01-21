'use client';

import Image from 'next/image';
import { RefObject } from 'react';

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
    <section>
      <h2>Galerie</h2>

      <button onClick={onOpenCamera}>📸 Prendre une photo</button>

      <div>
        {photos.map((p, i) => (
          <Image
            key={i}
            src={p}
            alt=""
            width={80}
            height={80}
            onClick={() => onSelectPhoto(p)}
            style={{
              border: p === activePhoto ? '2px solid blue' : 'none',
            }}
          />
        ))}
      </div>

      {isCameraOpen && (
        <div>
          {!preview ? (
            <>
              <video ref={videoRef} autoPlay muted />
              <button onClick={onTakePhoto}>📷 Capturer</button>
              <button onClick={onCloseCamera}>❌ Annuler</button>
            </>
          ) : (
            <>
              <Image src={preview} alt="" width={300} height={200} />
              <button onClick={onSavePhoto}>✅ Utiliser</button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
