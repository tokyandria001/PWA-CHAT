"use client";

import { useEffect } from "react";

export default function NotificationManager() {
  useEffect(() => {
    if (typeof window === "undefined" || typeof Notification === "undefined") return;

    Notification.requestPermission().then((permission) => {
      console.log("Permission notifications :", permission);
    });

    const handlePhotoTaken = () => {
      if (Notification.permission === "granted") {
        new Notification("📸 Nouvelle photo enregistrée !");
      }
    };

    window.addEventListener("photo-taken", handlePhotoTaken);

    return () => {
      window.removeEventListener("photo-taken", handlePhotoTaken);
    };
  }, []);

  return null;
}
