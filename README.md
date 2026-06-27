# AquaPredict

AquaPredict est une plateforme de supervision hydraulique (débit, pression, température) avec détection de fuite, alertes et visualisation en temps réel.

## Services du projet

| Service | Rôle | Commande | Port par défaut |
| --- | --- | --- | --- |
| Frontend (Vite + React) | Interface web | `npm run dev` | `8080` |
| Backend Node (Express) | Auth, alertes, API locale | `npm run start` | `4000` |
| WebSocket Node | Push des alertes temps réel | inclus dans `npm run start` | `4001` |
| API IA (FastAPI) | Prédiction fuite + analyse réseau | `uvicorn app:app --reload --port 7860` | `7860` |
| Logger série (optionnel) | Lecture capteur via port série + envoi Supabase | `npm run data:serial` | - |

## Prérequis

- Node.js 20+
- npm 10+
- Python 3.10+

## Installation

```sh
npm install
pip install -r requirements.txt
```

## Démarrage rapide (tous les serveurs)

Lancer chaque service dans un terminal séparé depuis la racine du projet.

### Terminal 1 — Frontend

```sh
npm run dev
```

### Terminal 2 — Backend Node (API + WebSocket)

```sh
npm run start
```

### Terminal 3 — API IA (FastAPI)

```sh
uvicorn app:app --reload --port 7860
```

## Acquisition de données série (optionnel)

1. Copier le fichier d'environnement :

   ```sh
   cp scripts/.env.example scripts/.env
   ```

2. Adapter `scripts/.env` (port série, URL Supabase, clé API, etc.).
3. Lancer l'acquisition :

   ```sh
   npm run data:serial
   ```

Guide détaillé : `QUICKSTART_SERIAL.md`

## Scripts utiles

```sh
npm run dev        # Frontend local
npm run start      # Backend Node + WebSocket
npm run data:serial
npm run test
npm run lint
npm run build
npm run preview
```

## Arborescence principale

- `src/` : application React
- `server.js` : backend Express + WebSocket
- `app.py` : API FastAPI (modèle IA)
- `scripts/serial-logger.js` : ingestion des données capteur
- `supabase/functions/hydraulic-data-receiver` : fonction Edge Supabase
