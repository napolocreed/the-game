# Déployer le serveur push sur GCP (Cloud Run + Firestore + Cloud Scheduler)

Résultat : des **notifications de rappel qui arrivent même app fermée** — le push
est délivré par le système (FCM sur Android), pas par l'app, donc un téléphone
qui tue les apps en arrière-plan n'y change rien.

**Coût attendu : ~0 €** (tout tient dans les tiers gratuits : Cloud Run scale-to-zero,
Firestore < 1 Go, Cloud Scheduler ≤ 3 jobs).

## Architecture

```
PWA (GitHub Pages) ──subscribe + rappels + timezone──▶ Cloud Run (ce serveur)
                                                          │        ▲
                                                       Firestore   │ GET /check toutes les 5 min
                                                                   │ (réveille + rattrape)
Google FCM ◀──envoi chiffré+signé VAPID à l'heure due────┘   Cloud Scheduler
   └──▶ réveille le service worker du téléphone → notification (app fermée ✓)
```

Cloud Run s'endort à zéro instance : le cron interne ne tourne donc pas en
continu. C'est prévu — l'endpoint `/check` fait du **rattrapage** depuis le
dernier passage, et Cloud Scheduler l'appelle toutes les 5 minutes. Précision
des rappels : ±5 min.

## Prérequis

- [gcloud CLI](https://cloud.google.com/sdk/docs/install) installé et connecté :
  ```bash
  gcloud auth login
  gcloud config set project VOTRE_PROJECT_ID
  ```

## 1. Activer les APIs (une fois)

```bash
gcloud services enable run.googleapis.com firestore.googleapis.com \
  cloudscheduler.googleapis.com cloudbuild.googleapis.com \
  artifactregistry.googleapis.com
```

## 2. Créer la base Firestore (une fois)

```bash
gcloud firestore databases create --location=europe-west1
```

(Si le projet a déjà une base Firestore/Datastore, sautez cette étape.)

## 3. Générer les clés VAPID (une fois — gardez-les précieusement)

```bash
npx web-push generate-vapid-keys
```

Notez `Public Key` et `Private Key`. ⚠️ Si vous changez ces clés plus tard,
tous les abonnements existants deviennent invalides.

## 4. Déployer sur Cloud Run

Depuis la **racine du repo** (adaptez les 3 valeurs `VAPID_*` et l'email) :

```bash
gcloud run deploy the-game-push \
  --source server \
  --region europe-west1 \
  --allow-unauthenticated \
  --max-instances 1 \
  --set-env-vars "STORAGE=firestore,ALLOWED_ORIGINS=https://napolocreed.github.io,CONTACT_EMAIL=mailto:vous@example.com,VAPID_PUBLIC_KEY=VOTRE_CLE_PUBLIQUE,VAPID_PRIVATE_KEY=VOTRE_CLE_PRIVEE"
```

À la fin, gcloud affiche la **Service URL** (ex. `https://the-game-push-xxxxx-ew.a.run.app`).
Testez :

```bash
curl https://VOTRE_SERVICE_URL/health          # → ok
curl https://VOTRE_SERVICE_URL/vapidPublicKey  # → {"publicKey":"..."}
```

> Variante plus stricte : stockez la clé privée dans Secret Manager et passez-la
> avec `--set-secrets "VAPID_PRIVATE_KEY=vapid-private-key:latest"` au lieu de
> `--set-env-vars`. Pour un projet personnel, les env vars suffisent.

> Permissions : le compte de service par défaut de Cloud Run a accès à Firestore
> sur la plupart des projets. Si vous voyez des erreurs `PERMISSION_DENIED` dans
> les logs, accordez `roles/datastore.user` au compte de service du service.

## 5. Créer le job Cloud Scheduler (une fois)

```bash
gcloud scheduler jobs create http the-game-push-check \
  --schedule="*/5 * * * *" \
  --uri="https://VOTRE_SERVICE_URL/check" \
  --http-method=GET \
  --location=europe-west1
```

## 6. Brancher le frontend

1. GitHub → repo → **Settings → Secrets and variables → Actions → Variables**
   → **New repository variable** :
   - Name : `PUSH_SERVER_URL`
   - Value : `https://VOTRE_SERVICE_URL` (sans slash final)
2. Relancez le workflow **Build & Deploy** (onglet Actions → Run workflow),
   ou poussez n'importe quel commit sur `main`.

## 7. Activer sur le téléphone

1. Ouvrez la PWA (installée depuis GitHub Pages) — rechargez pour prendre la
   nouvelle version.
2. Settings → Notifications → **Enable**, puis activez **Push (app closed)**.
3. **Send Test Notification** → la notification doit arriver via le serveur.
4. Mettez une heure de rappel sur une habitude, fermez l'app : le rappel
   arrivera quand même (±5 min).

## Notes plateforme

- **Android** : fonctionne app fermée, y compris avec l'optimisation de
  batterie (c'est FCM qui délivre, au niveau système).
- **iOS** : nécessite iOS 16.4+, l'app **ajoutée à l'écran d'accueil**, et
  l'autorisation de notifications donnée depuis la PWA installée.

## Dépannage

```bash
# Logs du serveur
gcloud run services logs read the-game-push --region europe-west1 --limit 50

# Forcer un passage du scheduler
gcloud scheduler jobs run the-game-push-check --location=europe-west1
```

- Toggle "Push (app closed)" en erreur → vérifiez `ALLOWED_ORIGINS` (doit être
  exactement l'origine de la PWA, sans slash final) et `/vapidPublicKey`.
- Notifications de test OK mais pas les rappels → vérifiez que le job Scheduler
  tourne (`gcloud scheduler jobs list`) et que l'habitude a bien une heure de
  rappel et le bon jour planifié.
