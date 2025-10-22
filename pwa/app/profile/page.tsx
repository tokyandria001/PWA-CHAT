"use client";

import { useState, useEffect, useRef } from "react";

export default function Reception() {
  const [pseudo, setPseudo] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [rooms, setRooms] = useState<string[]>(["Général", "Développement", "Projet"]);
  const [photos, setPhotos] = useState<string[]>([]);

  // 🎥 Gestion caméra
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
    if (storedPhotos) {
      setPhotos(JSON.parse(storedPhotos));
    }
  }, []);

  // Sauvegarde profil
  const saveProfile = () => {
    localStorage.setItem("profile", JSON.stringify({ pseudo, photo }));
    alert("Profil sauvegardé !");
  };

  // Ouvre la caméra
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      setIsCameraOpen(true);

      // Attendre que le <video> soit monté
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(err => console.error("Erreur lecture vidéo :", err));
        }
      }, 100);
    } catch (err) {
      alert("Erreur : impossible d'accéder à la caméra.");
      console.error(err);
    }
  };

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

  // Sauvegarde la photo capturée
  const savePhoto = () => {
    if (!preview) return;

    // ✅ Met à jour la photo de profil
    setPhoto(preview);
    localStorage.setItem("photo", preview);
    localStorage.setItem("profile", JSON.stringify({ pseudo, photo: preview }));

    // ✅ Ajoute à la galerie
    const updatedPhotos = [preview, ...photos];
    setPhotos(updatedPhotos);
    localStorage.setItem("photos", JSON.stringify(updatedPhotos));

    // 🔔 Notification
    window.dispatchEvent(new Event("photo-taken"));

    // Ferme la caméra et reset
    closeCamera();
  };

  // Ferme la caméra proprement
  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    setIsCameraOpen(false);
    setPreview(null);
  };

  // Vide la galerie
  const clearGallery = () => {
    if (confirm("Supprimer toutes les photos ?")) {
      localStorage.removeItem("photos");
      setPhotos([]);
    }
  };

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Connexion</h1>

      <input
        type="text"
        placeholder="Votre pseudo"
        value={pseudo}
        onChange={(e) => setPseudo(e.target.value)}
      />

      {/* 📸 Bouton pour ouvrir la caméra */}
      <button onClick={openCamera}>📸 Prendre une photo</button>

      {photo && (
        <div style={{ marginTop: "1rem" }}>
          <h3>Photo de profil :</h3>
          <img src={photo} alt="profil" width={100} style={{ borderRadius: "8px" }} />
        </div>
      )}

      <button onClick={saveProfile} style={{ marginTop: "1rem" }}>
        💾 Sauvegarder profil
      </button>

      <h2>Rooms disponibles</h2>
      <ul>
        {rooms.map((r) => (
          <li key={r}>
            <a href={`/room/${r}`}>➡️ {r}</a>
          </li>
        ))}
      </ul>

      {/* === Galerie === */}
      <section style={{ marginTop: "2rem" }}>
        <h2>🖼️ Galerie</h2>
        {photos.length === 0 ? (
          <p>Aucune photo enregistrée.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: "10px",
              marginTop: "1rem",
            }}
          >
            {photos.map((p, i) => (
              <img
                key={i}
                src={p}
                alt={`photo-${i}`}
                style={{
                  width: "100%",
                  borderRadius: "10px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                }}
              />
            ))}
          </div>
        )}

        {photos.length > 0 && (
          <button
            onClick={clearGallery}
            style={{
              marginTop: "1rem",
              backgroundColor: "#c62828",
              color: "white",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            🗑️ Vider la galerie
          </button>
        )}
      </section>

      {/* === Modale Caméra === */}
      {isCameraOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.8)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999,
        }}>
          {!preview ? (
            <>
              <div style={{
                width: 320,
                height: 320,
                border: "2px solid #0070f3",
                borderRadius: 12,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <video
                  ref={videoRef}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  autoPlay
                  playsInline
                  muted
                ></video>
              </div>

              <div style={{ marginTop: "1rem" }}>
                <button onClick={takePhoto}>📷 Capturer</button>
                <button onClick={closeCamera} style={{ marginLeft: "10px" }}>❌ Annuler</button>
              </div>
            </>
          ) : (
            <>
              <img src={preview} alt="Aperçu" width={300} style={{ borderRadius: "10px" }} />
              <div style={{ marginTop: "1rem" }}>
                <button onClick={savePhoto}>✅ Utiliser cette photo</button>
                <button onClick={() => setPreview(null)} style={{ marginLeft: "10px", backgroundColor: "#f57c00" }}>🔄 Reprendre</button>
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}
