'use client';

import { useEffect, useRef, useState } from 'react';
import styles from '@/app/page.module.css';

export default function CameraPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setIsCameraOn(true);
    } catch (error) {
      console.error('Erreur d’accès à la caméra :', error);
      alert("Permission refusée ou appareil non détecté.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraOn(false);
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/png');
    setPhoto(dataUrl);

    const stored = JSON.parse(localStorage.getItem('photos') || '[]');
    stored.push(dataUrl);
    localStorage.setItem('photos', JSON.stringify(stored));
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Caméra</h1>

      <div className={styles.buttonGroup}>
        {!isCameraOn ? (
          <button onClick={startCamera} className={styles.button}>Activer la caméra</button>
        ) : (
          <button onClick={stopCamera} className={styles.button}>Désactiver la caméra</button>
        )}
      </div>

      <div className={styles.videoContainer}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={isCameraOn ? styles.video : styles.videoHidden}
        />
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>

      {isCameraOn && (
        <div className={styles.buttonGroup}>
          <button onClick={takePhoto} className={styles.button}>📸 Prendre une photo</button>
        </div>
      )}

      {photo && (
        <div className={styles.photoPreview}>
          <h2>🖼️ Dernière photo prise :</h2>
          <img src={photo} alt="Photo capturée" className={styles.image} />
        </div>
      )}
    </div>
  );
}