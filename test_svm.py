import numpy as np
import joblib
import os

# Chemins vers les fichiers
model_path = 'models/leak_detection_model.pkl'
scaler_path = 'models/scaler.pkl'

# Charger le modèle et le scaler
model = joblib.load(model_path)
scaler = joblib.load(scaler_path)

# Test avec des valeurs arbitraires (Pressure, Flow, Temp)
# On simule les 6 colonnes attendues (les 3 originales + les 3 moyennes)
test_data = np.array([[2.5, 150.0, 20.0, 2.5, 150.0, 20.0]])

# Mise à l'échelle
data_scaled = scaler.transform(test_data)

# Prédiction
prob = model.predict_proba(data_scaled)[:, 1][0]

print(f"--- Résultat du test ---")
print(f"Entrées : {test_data[0]}")
print(f"Probabilité de fuite détectée : {prob:.4f}")