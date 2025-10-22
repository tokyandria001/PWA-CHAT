'use client';

import { useState, useEffect, useRef } from "react";

export default function Reception() {
  const [pseudo, setPseudo] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [rooms, setRooms] = useState<string[]>(["Général", "Développement", "Projet"]);
  const [photos, setPhotos] = useState<string[]>([]);

  // Caméra
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Charger profil + galerie depuis localStorage
  useEffect(() => {
    const storedProfile = localStorage.getItem("profile");
    if (storedProfile) {
      const parsed = JSON.parse(storedProfile);
      setPseudo(parsed.pseudo || "");
      setPhoto(parsed.photo || null);
    }

    const storedPhotos = localStorage.getItem("photos");
    if (storedPhotos) setPhotos(JSON.parse(storedPhotos));
  }, []);

  // Sauvegarder profil
  const saveProfile = () => {
    localStorage.setItem("profile", JSON.stringify({ pseudo, photo }));
    alert("Profil sauvegardé !");
  };

  // Ouvrir caméra
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      setIsCameraOpen(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.error);
        }
      }, 100);
    } catch (err) {
      alert("Erreur : impossible d'accéder à la caméra.");
      console.error(err);
    }
  };

  // Prendre photo
  const takePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/png");
    setPreview(dataUrl);
  };

  // Sauvegarder photo
  const savePhoto = () => {
    if (!preview) return;

    setPhoto(preview);
    localStorage.setItem("photo", preview);
    localStorage.setItem("profile", JSON.stringify({ pseudo, photo: preview }));

    const updatedPhotos = [preview, ...photos];
    setPhotos(updatedPhotos);
    localStorage.setItem("photos", JSON.stringify(updatedPhotos));

    window.dispatchEvent(new Event("photo-taken"));
    closeCamera();
  };

  // Fermer caméra
  const closeCamera = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    setIsCameraOpen(false);
    setPreview(null);
  };

  // Vider galerie
  const clearGallery = () => {
    if (confirm("Supprimer toutes les photos ?")) {
      localStorage.removeItem("photos");
      setPhotos([]);
    }
  };

  return (
    <main className="container" style={{ padding: "2rem", maxWidth: 800, margin: "0 auto", fontFamily: "'Segoe UI', sans-serif" }}>
      <h1 style={{ textAlign: "center", color: "#0070f3" }}>Connexion</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
        <input
          type="text"
          placeholder="Votre pseudo"
          value={pseudo}
          onChange={e => setPseudo(e.target.value)}
          style={{
            padding: "12px 16px",
            borderRadius: 8,
            border: "1px solid #ccc",
            fontSize: 16,
            outline: "none",
            boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)"
          }}
        />
        <button
          onClick={openCamera}
          style={{
            padding: "12px 16px",
            backgroundColor: "#0070f3",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: "bold",
            transition: "background-color 0.2s"
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "#005bb5"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "#0070f3"}
        >
          📸 Prendre une photo
        </button>
        {photo && (
          <div style={{ textAlign: "center" }}>
            <h3>Photo de profil</h3>
            <img src={photo} alt="profil" style={{ width: 120, height: 120, borderRadius: "50%", border: "2px solid #0070f3", objectFit: "cover" }} />
          </div>
        )}
        <button
          onClick={saveProfile}
          style={{
            padding: "12px 16px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: "bold",
            transition: "background-color 0.2s"
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "#218838"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "#28a745"}
        >
          💾 Sauvegarder profil
        </button>
      </div>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ color: "#0070f3" }}>Rooms disponibles</h2>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {rooms.map(room => (
            <a
              key={room}
              href={`/room/${room}`}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                backgroundColor: "#e5e5ea",
                textDecoration: "none",
                color: "#000",
                fontWeight: "600",
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                transition: "background-color 0.2s"
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#d0d0d5")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#e5e5ea")}
            >
              ➡️ {room}
            </a>
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ color: "#0070f3" }}>🖼️ Galerie</h2>
        {photos.length === 0 ? <p>Aucune photo enregistrée.</p> :
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginTop: 10 }}>
            {photos.map((p, i) => (
              <img key={i} src={p} alt={`photo-${i}`} style={{ width: "100%", borderRadius: 10, objectFit: "cover", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }} />
            ))}
          </div>
        }
        {photos.length > 0 && (
          <button
            onClick={clearGallery}
            style={{
              marginTop: 10,
              backgroundColor: "#c62828",
              color: "white",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: 5,
              cursor: "pointer",
              fontWeight: "bold",
              transition: "background-color 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "#a71d1d"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "#c62828"}
          >
            🗑️ Vider la galerie
          </button>
        )}
      </section>

      {/* Modale caméra */}
      {isCameraOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.85)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999,
          padding: "1rem"
        }}>
          {!preview ? (
            <>
              <div style={{
                width: "100%",
                maxWidth: 400,
                aspectRatio: "1 / 1",
                border: "2px solid #0070f3",
                borderRadius: 12,
                overflow: "hidden",
                backgroundColor: "#000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <video
                  ref={videoRef}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  autoPlay
                  playsInline
                  muted
                />
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
                <button onClick={takePhoto} style={{ padding: "8px 16px", borderRadius: 8, border: "none", backgroundColor: "#0070f3", color: "white", cursor: "pointer" }}>📷 Capturer</button>
                <button onClick={closeCamera} style={{ padding: "8px 16px", borderRadius: 8, border: "none", backgroundColor: "#c62828", color: "white", cursor: "pointer" }}>❌ Annuler</button>
              </div>
            </>
          ) : (
            <>
              <img src={preview} alt="Aperçu" style={{ width: "100%", maxWidth: 400, borderRadius: 12 }} />
              <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
                <button onClick={savePhoto} style={{ padding: "8px 16px", borderRadius: 8, border: "none", backgroundColor: "#28a745", color: "white", cursor: "pointer" }}>✅ Utiliser</button>
                <button onClick={() => setPreview(null)} style={{ padding: "8px 16px", borderRadius: 8, border: "none", backgroundColor: "#f57c00", color: "white", cursor: "pointer" }}>🔄 Reprendre</button>
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}
