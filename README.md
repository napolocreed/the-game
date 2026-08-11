# The Game 🎮

Une PWA de suivi d'habitudes gamifiée, au look pixel art : chaque bonne habitude devient une quête, chaque journée rapporte de l'XP, des badges et des séries (streaks).

## Fonctionnalités

- **Habitudes planifiables** : catégories, difficulté, jours de la semaine, heure de rappel, archivage, duplication, réorganisation par glisser-déposer.
- **⚔️ Boss Fights (sevrage & addictions)** : chaque chose à arrêter devient un boss à combattre.
  - Compteur de jours clean avec paliers récompensés en XP (1 j, 3 j, 1 semaine… 2 ans), antidatage possible si vous êtes déjà clean depuis un moment.
  - Bouton **« I have an urge »** : outil de *urge surfing* — respiration guidée ~90 s pour laisser passer le craving, avec XP à la clé (les envies résistées comptent).
  - **Rechute compatissante** : un écart remet le compteur courant à zéro mais ne retire jamais le meilleur streak, les jours clean cumulés ni l'argent économisé. Une note optionnelle aide à identifier le déclencheur.
  - Argent économisé calculé si vous renseignez un coût/jour.
- **📝 Journal de bord** : humeur (1–5) et note libre sur chaque jour du calendrier — utile pour repérer les patterns et les déclencheurs.
- **Gamification** : XP et niveaux, quêtes quotidiennes générées selon vos habitudes, badges à paliers (bronze/argent/or…).
- **Compassion intégrée** : statuts « fait / raté / passé » avec impact différencié sur les séries, fenêtre de 48 h pour rattraper un oubli.
- **Analytique** : heatmap façon GitHub, graphiques hebdo, répartition par catégorie, insights personnels, vue calendrier.
- **PWA** : installable, fonctionne entièrement hors-ligne, notifications.

## Démarrage rapide

```bash
npm install
npm run dev        # http://localhost:5173
```

Build de production :

```bash
npm run build      # sortie dans dist/
npm run preview    # sert le build localement
```

## Sauvegarde des données 💾

Les données vivent dans le navigateur (localStorage), avec **trois filets de sécurité** :

1. **Miroir IndexedDB** : chaque changement est répliqué dans IndexedDB. Si le localStorage est vidé (nettoyage du navigateur, éviction…), l'app détecte le vide au démarrage et **propose de restaurer automatiquement** la copie miroir.
2. **Snapshots hebdomadaires** : un instantané est conservé chaque semaine dans IndexedDB (8 derniers).
3. **Export/Import manuel** : dans Réglages → Backup & Restore, exportez un fichier JSON (recommandé régulièrement — c'est la seule sauvegarde qui survit à une réinstallation complète du navigateur).

L'app demande aussi le [stockage persistant](https://developer.mozilla.org/docs/Web/API/StorageManager/persist) au navigateur pour limiter les évictions.

## Notifications 🔔

Deux niveaux, du plus simple au plus complet :

### 1. Rappels locaux (aucune configuration)

Activez les notifications dans Réglages → Notifications. Les rappels des habitudes (champ « Reminder Time ») se déclenchent tant que l'app est ouverte — onglet ou PWA installée. Fonctionne sans aucun serveur.

### 2. Push serveur (app fermée) — optionnel

Pour recevoir les rappels même app fermée, déployez le petit serveur du dossier [`server/`](server/README.md) (Render, Railway, fly.io… + une base Postgres), puis :

1. Renseignez l'URL du serveur dans `.env.local` :
   ```
   VITE_PUSH_SERVER_URL=https://votre-serveur.onrender.com
   ```
   (ou la variable de dépôt `PUSH_SERVER_URL` pour le déploiement GitHub Pages).
2. Rebuildez/redéployez l'app.
3. Dans Réglages → Notifications, activez le toggle « Push (app closed) ».

La clé publique VAPID est récupérée automatiquement depuis le serveur (plus de clé à copier-coller), et les rappels sont envoyés dans **votre fuseau horaire** en respectant les jours planifiés de chaque habitude.

## Déploiement 🚀

Le workflow GitHub Actions [`deploy.yml`](.github/workflows/deploy.yml) construit l'app à chaque push et la déploie sur **GitHub Pages** à chaque push sur `main`.

Activation (une seule fois) : dans les réglages du dépôt GitHub → **Pages** → Source : **GitHub Actions**. L'app sera servie sur `https://<votre-compte>.github.io/the-game/`.

Pour activer le push serveur en production, ajoutez la variable de dépôt `PUSH_SERVER_URL` (Settings → Secrets and variables → Actions → Variables).

## Structure du projet

```
├── App.tsx                  # Composition de l'UI et modales
├── hooks/useGameLogic.ts    # Toute la logique de jeu (état, XP, quêtes, badges…)
├── components/              # Composants React (pixel art / Tailwind)
├── utils/
│   ├── badges.ts, quests.ts, xp.ts   # Règles de gamification
│   ├── quits.ts             # Boss Fights : paliers, streaks, jours clean
│   ├── db.ts                # Miroir IndexedDB + snapshots + récupération
│   ├── notifications.ts     # Affichage de notifications (compatible PWA Android)
│   └── serviceWorkerRegistration.ts
├── public/sw.js             # Service worker : offline + push + clic notification
├── server/                  # Serveur push optionnel (Express + web-push + Postgres)
└── backlog.txt              # Historique des sprints et roadmap
```
