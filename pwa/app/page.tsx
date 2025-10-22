"use client"

import Link from 'next/link';
import { useEffect } from 'react';

export default function Home() {

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("✅ Service Worker enregistré"))
        .catch((err) => console.error("SW erreur :", err));
    }
  }, []);

  return (
    <main className="container">
      <h1 className="title">Bienvenue sur ChatCam</h1>
      <p className="description">
        Une Progressive Web App pour discuter, prendre des photos, et partager !
      </p>
      <h2>Technologies utilisées :</h2>
      <ul className="featuresList">
        <li>Next.js 13 (App Router)</li>
        <li>TypeScript</li>
        <li>React</li>
        <li>Service Workers + PWA (via next-pwa)</li>
        <li>Stockage local (localStorage)</li>
      </ul>
      <div style={{ textAlign: 'center' }}>
        <Link
          href="/profile"
          className="button"
          style={{ textDecoration: 'none' }}
        >
          Commencer →
        </Link>
      </div>
    </main>
  );
}
