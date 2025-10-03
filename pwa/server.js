const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const messagesFile = path.join(__dirname, 'messages.json');

// Charge les messages existants ou initialise un tableau vide
let messages = [];
try {
  if (fs.existsSync(messagesFile)) {
    const data = fs.readFileSync(messagesFile, 'utf-8');
    messages = JSON.parse(data);
  }
} catch (err) {
  console.error('Erreur lecture fichier messages:', err);
}

const wss = new WebSocket.Server({ port: PORT });

console.log(`Serveur WebSocket démarré sur le port ${PORT}`);

wss.on('connection', (ws, req) => {
  // Récupère params URL (room, username)
  const urlParams = new URLSearchParams(req.url.replace('/?', ''));
  const room = urlParams.get('room');

  console.log(`Nouvelle connexion dans la salle: ${room}`);

  // Envoie tous les messages déjà stockés pour cette salle
  const roomMessages = messages.filter(m => m.room === room);
  ws.send(JSON.stringify({ type: 'init', messages: roomMessages }));

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      if (!message.id || !message.username || !message.content || !message.timestamp) {
        console.log('Message invalide reçu');
        return;
      }
      message.room = room; // Associe la salle au message

      // Sauvegarde en mémoire
      messages.push(message);

      // Sauvegarde dans le fichier (écrase tout le fichier)
      fs.writeFile(messagesFile, JSON.stringify(messages, null, 2), (err) => {
        if (err) console.error('Erreur sauvegarde messages:', err);
      });

      // Envoie à tous les clients connectés dans la même salle
      wss.clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          // Vérifie la salle du client
          const clientUrl = client.upgradeReq ? client.upgradeReq.url : null;
          // Sur certains serveurs, client.upgradeReq peut être absent, on simplifie ici :
          client.send(JSON.stringify(message));
        }
      });

    } catch (err) {
      console.error('Erreur traitement message:', err);
    }
  });

  ws.on('close', () => {
    console.log('Client déconnecté');
  });
});
