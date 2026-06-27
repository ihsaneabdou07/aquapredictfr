# AquaPredict - Démarrage Rapide (Acquisition Série)

## 1. Copier le fichier d'exemple

```powershell
cp scripts\.env.example scripts\.env
```

## 2. Éditer `scripts\.env`

```env
SERIAL_PORT=COM7      # Port COM de ton ESP32 (Windows) ou /dev/ttyUSB0 (Linux)
SERIAL_BAUD=115200    # Vitesse du port (doit correspondre au firmware)
```

## 3. Lancer l'acquisition

```powershell
npm run data:serial
```

### Sortie attendue

```
[serial] Connecté sur COM7
[WS] Client connecté
💧 [F1:42.50 | F2:38.10 | F3:41.20] L/min
📊 [P1:3.20 | P2:3.10 | P3:3.15] bar
🌡 Température: 22.10 °C
--------------------------------------------------
```

## Format capteur attendu

L'ESP32 doit envoyer une ligne JSON par mesure via le port série :

```json
{"flow1": 42.5, "flow2": 38.1, "flow3": 41.2, "pressure1": 3.2, "pressure2": 3.1, "pressure3": 3.15, "temperature": 22.1}
```

Les valeurs manquantes sont remplacées par `0`.

## Architecture locale

```
ESP32 (USB/Série)
    │
    ▼
scripts/serial-logger.js   (port série → WebSocket)
    │
    ▼  ws://localhost:3001
React Dashboard (src/pages/Index.tsx)
    │
    ▼  POST http://localhost:8000/predict
app.py (FastAPI - modèle SVM)
    │
    ▼  POST http://localhost:4000/alert
server.js (alertes email)
```

## Troubleshooting

| Problème | Solution |
|---|---|
| Port non trouvé | Vérifier `SERIAL_PORT` dans `scripts/.env` et que l'ESP32 est branché |
| WS pas connecté | Vérifier que `npm run data:serial` est lancé avant d'ouvrir le dashboard |
| Données ignorées | Vérifier que le firmware envoie du JSON valide sur le port série |
| Pas de prédiction ML | Vérifier que `python app.py` est lancé sur le port 8000 |
