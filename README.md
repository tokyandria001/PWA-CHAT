# PWA-CHAT

## Présentation

**PWA Chat** est une application de chat en temps réel qui permet aux utilisateurs de :  
- Se créer un profil avec pseudo et photo.  
- Rejoindre des salons de discussion (rooms).  
- Envoyer des messages texte et des images.  
- Voir les messages et images des autres utilisateurs instantanément grâce à **Socket.IO**.  

L’application est conçue comme une **Progressive Web App (PWA)** pour être installable sur mobile et desktop.

---

## Technologies utilisées

| Catégorie               | Technologie                          |
|-------------------------|--------------------------------------|
| Frontend                | Next.js 15 (React + TypeScript)       |
| Styles                  | CSS Modules                           |
| Communication temps réel | Socket.IO                             |
| Stockage local          | `localStorage`                        |
| Gestion des images      | Base64, Canvas pour redimensionnement |
| Déploiement             | VPS avec SSH et PM2, CI/CD GitHub Actions |

---

## Fonctionnalités principales

### 1. Profil utilisateur
- Saisie d’un pseudo.  
- Choix d’une photo via caméra ou importation.  
- Sauvegarde dans `localStorage`.  
- Prévisualisation des photos dans une galerie.  

### 2. Gestion des salons (Rooms)
- Liste dynamique des salons disponibles.  
- Nombre de participants affiché pour chaque room.  
- Rejoindre une room pour discuter en temps réel.  

### 3. Chat en temps réel
- Envoi de messages texte et images.  
- Affichage instantané des messages et images des autres utilisateurs.  
- Historique limité à 50 messages par salon (stocké dans `localStorage`).  
- Notification visuelle lors de l’envoi d’une photo.

### 4. Caméra et galerie
- Prise de photo via webcam.  
- Redimensionnement automatique pour éviter les dépassements de quota `localStorage`.  
- Sélection rapide d’une photo de profil depuis la galerie.  

---

## Installation et lancement

1. **Cloner le dépôt**

```bash
git clone https://github.com/...
cd PWA-CHAT
npm install
npm run dev

```