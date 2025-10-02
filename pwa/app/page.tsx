import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        TP – Progressive Web App : Client de messagerie instantanée
      </h1>

      <p className={styles.description}>
        Bienvenue dans votre application PWA de messagerie. Voici les fonctionnalités disponibles :
      </p>

      <ul className={styles.featuresList}>
        <li>Prendre une photo avec la caméra (PWA, notifications, stockage local)</li>
        <li>Modifier sa fiche utilisateur (offline)</li>
        <li>Voir les anciennes conversations (offline)</li>
        <li>Voir les pièces jointes (offline)</li>
        <li>Créer ou rejoindre un chat (en ligne)</li>
      </ul>

      <p className={styles.footerText}>
        Utilisez le menu ci-dessus pour accéder aux différentes sections de l'application.
      </p>
    </div>
  );
}
