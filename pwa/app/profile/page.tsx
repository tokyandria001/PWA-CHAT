'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ReceptionPage() {
  const [pseudo, setPseudo] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [rooms, setRooms] = useState(['General', 'Tech', 'Random']);
  const [selectedRoom, setSelectedRoom] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);

  const router = useRouter();

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
      setStream(mediaStream);
      setCameraOn(true);
    } catch (error) {
      alert("Impossible d'accéder à la caméra");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraOn(false);
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
    stopCamera();
  };

  const retakePhoto = () => {
    setPhoto(null);
    startCamera();
  };

  useEffect(() => {
    if (!photo) {
      startCamera();
    }
    return () => stopCamera();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!pseudo.trim()) {
      alert('Veuillez entrer un pseudo');
      return;
    }
    if (!photo) {
      alert('Veuillez prendre une photo');
      return;
    }
    if (!selectedRoom) {
      alert('Veuillez sélectionner une salle');
      return;
    }

    sessionStorage.setItem('username', pseudo);
    sessionStorage.setItem('photo', photo);

    router.push(`/room/${selectedRoom.toLowerCase()}`);

  };

  return (
    <main className="container">
      <h1 className="title" style={{ textAlign: 'center', marginBottom: '2rem' }}>Connexion</h1>

      <form onSubmit={handleSubmit}>
        <div className="formGroup">
          <label htmlFor="pseudo" className="label">Pseudo</label>
          <input
            type="text"
            id="pseudo"
            className="input"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            placeholder="Votre pseudo"
            required
          />
        </div>

        <div className="formGroup">
          <label className="label">Photo</label>

          {!photo ? (
            <>
              <div className="videoContainer">
                <video ref={videoRef} autoPlay playsInline className={cameraOn ? 'video' : 'videoHidden'} />
              </div>
              <canvas ref={canvasRef} className="canvas" />
              <div className="buttonGroup" style={{ justifyContent: 'center' }}>
                <button type="button" onClick={takePhoto} className="button">Prendre une photo</button>
              </div>
            </>
          ) : (
            <div className="photoPreview">
              <img src={photo} alt="Photo capturée" className="image" />
              <div className="buttonGroup" style={{ justifyContent: 'center' }}>
                <button type="button" onClick={retakePhoto} className="button">Reprendre</button>
              </div>
            </div>
          )}
        </div>

        <div className="formGroup">
          <label htmlFor="room" className="label">Choisir une salle</label>
          <select
            id="room"
            className="input"
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            required
          >
            <option value="">-- Sélectionnez une salle --</option>
            {rooms.map(room => (
              <option key={room} value={room}>{room}</option>
            ))}
          </select>
        </div>

        <div className="buttonGroup" style={{ justifyContent: 'center' }}>
          <button type="submit" className="button">Se connecter</button>
        </div>
      </form>
    </main>
  );
}
