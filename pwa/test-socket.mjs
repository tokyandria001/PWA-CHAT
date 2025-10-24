import { io } from "socket.io-client";

const socket = io("https://api.tools.gavago.fr", {
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("✅ Connecté au serveur :", socket.id);

  // Rejoindre une room
  const pseudo = "toky";
  const roomName = "general";

  socket.emit("chat-join-room", { pseudo, roomName });  // clé correcte
  console.log(`🟢 Rejoint la room '${roomName}' en tant que ${pseudo}`);

  // Envoyer un message test
  socket.emit("chat-msg", { content: "Hello depuis Node.js 👋", roomName });
});

socket.on("chat-msg", (msg) => {
  console.log("📥 Nouveau message reçu :", msg);
});

socket.on("connect_error", (err) => {
  console.error("❌ Erreur de connexion :", err.message);
});
