# AquaPredict

Système de surveillance et de détection de fuites pour réseaux hydrauliques de distribution d'eau. Fonctionne entièrement en local : tableau de bord React temps réel, backend ML FastAPI (SVM), serveur Node.js pour les alertes email, et acquisition de données IoT via port série.

---

## Architecture locale

```
ESP32/Arduino (USB/Série COM7)
         │
         ▼
scripts/serial-logger.js
(lecture port série → broadcast WebSocket :3001)
         │
         ▼  ws://localhost:3001
React Dashboard  ──── POST ──►  app.py (FastAPI :8000)
(Vite :8080)                    Modèle SVM - /predict
         │
         └── POST ──► server.js (Express :4000)
                      Alertes email (Nodemailer)
```

---

## Stack technique

### Frontend
| Technologie | Version | Rôle |
|---|---|---|
| React | 18.3.1 | UI framework |
| TypeScript | 5.8.3 | Typage statique |
| Vite | 8.1.0 | Build tool / dev server (port 8080) |
| Tailwind CSS | 3.4.17 | Styles utilitaires |
| shadcn/ui | latest | Composants UI |
| React Router | 6.30.4 | Routage SPA |
| TanStack Query | 5.83.0 | Fetching / cache |
| Recharts | 2.15.4 | Graphiques hydrauliques |
| React Leaflet | 5.0.0 | Carte du réseau |
| React Three Fiber | 8.18.0 | Jumeau numérique 3D |
| Framer Motion | 12.35.1 | Animations |
| Zod + React Hook Form | latest | Validation formulaires |

### Backend Python (ML)
| Technologie | Version | Rôle |
|---|---|---|
| FastAPI | latest | API REST de prédiction (port 8000) |
| scikit-learn | 1.3.2 | Modèle SVM (détection de fuites) |
| pandas | 3.0.3 | Traitement des données |
| NumPy | 2.5.0 | Calcul numérique |
| imbalanced-learn | latest | SMOTE (rééquilibrage classes) |
| ultralytics YOLOv8 | latest | Détection de composants réseau |
| joblib | latest | Sérialisation du modèle |

### Backend Node.js (Alertes)
| Technologie | Version | Rôle |
|---|---|---|
| Express | 5.2.1 | Serveur HTTP + auth utilisateurs (port 4000) |
| Nodemailer | 9.0.1 | Envoi d'alertes par email |
| ws | 8.18.3 | WebSocket temps réel (port 3001) |
| SerialPort | 13.0.0 | Lecture port série IoT |

---

## Prérequis

- **Node.js** 20+ et **npm** 10+
- **Python** 3.11+
- Un ESP32 ou simulateur JSON sur port série

---

## Installation

### 1. Dépendances Node.js

```sh
npm install
```

### 2. Dépendances Python

```sh
pip install -r requirements.txt
```

### 3. Variables d'environnement

```sh
cp scripts/.env.example scripts/.env
```

Éditer `scripts/.env` :

```env
SERIAL_PORT=COM7      # Port série de l'ESP32
SERIAL_BAUD=115200
```

Créer `.env` à la racine pour le serveur Node.js :

```env
GMAIL_USER=votre_email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
PORT=4000
FRONTEND_URL=http://localhost:8080
```

> Ne jamais committer de credentials. Le fichier `.env` est dans `.gitignore`.

---

## Démarrage

Lancer les 3 processus dans des terminaux séparés :

```sh
# Terminal 1 — Frontend React
npm run dev

# Terminal 2 — Acquisition IoT (port série → WebSocket)
npm run data:serial

# Terminal 3 — Backend ML
python app.py

# Terminal 4 — Serveur alertes (optionnel)
node server.js
```

| Service | URL |
|---|---|
| Dashboard React | http://localhost:8080 |
| API ML (FastAPI) | http://localhost:8000 |
| WebSocket IoT | ws://localhost:3001 |
| Serveur alertes | http://localhost:4000 |

---

## Scripts disponibles

```sh
npm run dev          # Serveur de développement Vite
npm run build        # Build de production (dist/)
npm run preview      # Prévisualisation du build
npm run lint         # ESLint
npm run test         # Tests unitaires (Vitest)
npm run data:serial  # Acquisition données IoT via port série
npm run start        # Démarre server.js (alertes email)
```

---

## Structure du projet

```
aquapredictfr/
├── src/                          # Frontend React/TypeScript
│   ├── pages/
│   │   ├── Index.tsx             # Dashboard principal (WebSocket + ML)
│   │   ├── Dashboard.tsx         # Vue alternative
│   │   ├── Login.tsx             # Authentification locale (localStorage)
│   │   └── NotFound.tsx          # 404
│   ├── components/
│   │   ├── AlertPanel.tsx        # Panneau d'alertes
│   │   ├── DigitalTwinViewer.tsx # Jumeau numérique 3D (Three.js)
│   │   ├── GaugeCard.tsx         # Jauges métriques
│   │   ├── HistoryChart.tsx      # Graphiques historiques
│   │   ├── NetworkMap.tsx        # Carte Leaflet du réseau
│   │   ├── LossSearchPlan.tsx    # Plan de recherche de pertes
│   │   ├── PipingForm.tsx        # Formulaire réseau
│   │   ├── StatusIndicator.tsx   # Indicateurs d'état
│   │   ├── UploadZone.tsx        # Upload de fichiers
│   │   └── ui/                  # Composants shadcn/ui
│   ├── hooks/
│   │   ├── useHydraulicData.ts   # Hook données hydrauliques
│   │   ├── use-toast.ts          # Notifications
│   │   └── use-mobile.tsx        # Détection mobile
│   └── lib/utils.ts              # Utilitaires
│
├── models/                       # Backend ML Python
│   ├── inference.py              # Prédiction probabilité de fuite (SVM)
│   ├── recorder.py               # Enregistrement mesures CSV
│   ├── network_vision.py         # Détection composants réseau (YOLOv8)
│   └── __init__.py
│
├── scripts/
│   ├── serial-logger.js          # Lecture port série → WebSocket :3001
│   └── .env.example             # Template variables d'environnement
│
├── test_all_data_flow/
│   └── test_all_data_flow.ino   # Firmware Arduino/ESP32 de test
│
├── app.py                        # Serveur FastAPI ML (port 8000)
├── server.js                     # Serveur Express alertes email (port 4000)
├── index.html                    # Point d'entrée HTML
├── Dockerfile                    # Image Docker
├── pyproject.toml                # Config Python / dépendances
├── requirements.txt              # Dépendances Python
├── package.json                  # Dépendances Node.js
├── vite.config.ts                # Config Vite
├── tailwind.config.ts            # Config Tailwind
├── tsconfig.json                 # Config TypeScript
└── _skhema_3.png                 # Schéma architecture réseau
```

---

## Flux de données IoT

L'ESP32 envoie du JSON par ligne sur le port série :

```json
{"flow1": 42.5, "flow2": 38.1, "flow3": 41.2, "pressure1": 3.2, "pressure2": 3.1, "pressure3": 3.15, "temperature": 22.1}
```

`scripts/serial-logger.js` lit ce flux et le broadcast via WebSocket sur `:3001`. Le dashboard React (`src/pages/Index.tsx`) reçoit les données et appelle l'API ML pour calculer la probabilité de fuite.

---

## Modèle ML (détection de fuites)

Modèle SVM entraîné sur `water_leak_detection_1000_rows.csv`.

**Endpoint :**

```
POST http://localhost:8000/predict
Content-Type: application/json

{"pressure": 3.2, "flow": 42.5, "temp": 22.1}
```

**Réponse :**

```json
{"leak_probability": 0.87}
```

Si `leak_probability >= 0.7`, le dashboard envoie une alerte à `server.js` (port 4000) qui déclenche un email.

> Les fichiers `.pkl` (modèle, scaler) ne sont pas versionnés. Les régénérer via le script d'entraînement ou les télécharger depuis le stockage du projet.

---

## Authentification

Login local via `localStorage` (pas de base de données) :

- Email : `client@test.com`
- Mot de passe : `12345678`

---

## CI/CD

Le pipeline GitHub Actions (`.github/workflows/ci.yml`) exécute à chaque push/PR :

1. `npm install`
2. `npm run lint`
3. `npm run test`

---

## Points d'attention

- **Credentials email** : utiliser exclusivement `.env` (ignoré par git). Créer un App Password Gmail, ne pas utiliser le mot de passe principal.
- **Modèles ML** : les `.pkl` sont des artefacts binaires, exclus du git via `.gitignore`.
- **Ports** : s'assurer qu'aucun autre processus n'occupe les ports 3001, 4000, 8000, 8080 avant de démarrer.
