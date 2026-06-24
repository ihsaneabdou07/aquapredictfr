# AquaPredict - Configuration Rapide (Acquisition Série)

## 1️⃣ Copier le fichier d'exemple

```powershell
cp scripts\.env.example scripts\.env
```

## 2️⃣ Éditer `scripts\.env`

Ouvre et remplis avec tes paramètres:

```env
# Port COM où est branché ton ESP32/capteur
SERIAL_PORT=COM3

# Vitesse du port (vérifier avec ton firmware)
SERIAL_BAUD=115200

# Fichier de log local
SERIAL_OUTPUT_FILE=data.txt

# === SUPABASE (optionnel mais recommandé) ===

# Activer pour envoyer vers le cloud
SERIAL_SEND_TO_SUPABASE=true

# URL complète de ta fonction Edge
SUPABASE_FUNCTION_URL=https://YOUR-PROJECT-REF.supabase.co/functions/v1/hydraulic-data-receiver

# Clé anon depuis Supabase > Settings > API
SUPABASE_ANON_KEY=eyJhbGci...

# Tronçon par défaut si absent de la trame
ID_TRONCON=TR-Z1-042
```

## 3️⃣ Lancer l'acquisition

```powershell
npm run data:serial
```

### Sortie attendue

```powershell
[serial] Port ouvert: COM3 @ 115200
[serial] Sauvegarde dans: data.txt
[serial] Envoi Supabase: active
Debit: 42.5 L/min
[serial] Envoi Supabase OK
```

## 🔧 Format capteur accepté

Ton capteur (ESP32) doit envoyer une ligne JSON par mesure :

```json
{"flow_rate": 42.5, "pressure": 3.2, "temperature": 22.1}
```

**Noms de champs acceptés :**

- Débit: `flow_rate`, `flow`, `debit`
- Pression: `pressure`, `pression`
- Température: `temperature`, `temp`
- ID tronçon: `idTroncon` (ou variable env ID_TRONCON)

## 📊 Vérifier les données

Les mesures sont sauvegardées dans `data.txt` (format JSONL) :

```bash
# Voir les 5 dernières mesures
tail -n 5 data.txt

# Compter les mesures
wc -l data.txt
```

## 🚀 Troubleshooting

| Problème | Solution |
| --- | --- |
| Port non trouvé | Vérifier SERIAL_PORT et brancher le device |
| Erreur Supabase 401 | Vérifier SUPABASE_ANON_KEY |
| Ligne d'erreur "Donnee ignoree" | Vérifier format JSON du capteur |
| Rien ne s'écrit dans data.txt | Vérifier les permissions du répertoire |

## 📝 Notes

- Les données locales (data.txt) ne sont **pas** commitées (ajoutées à .gitignore)
- Les variables d'environnement aussi (scripts/.env ignoré)
- Le script continue même si Supabase n'est pas accessible
- Les lignes mal formées sont silencieusement ignorées
