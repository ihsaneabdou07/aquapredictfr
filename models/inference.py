import joblib
import os

# Chargement sécurisé
model_path = os.path.join(os.path.dirname(__file__), 'leak_detection_model.pkl')
scaler_path = os.path.join(os.path.dirname(__file__), 'scaler.pkl')

model = joblib.load(model_path)
scaler = joblib.load(scaler_path)

def get_leak_probability(pressure, flow, temp):
    import numpy as np
    # Transformation des données
    data = np.array([[pressure, flow, temp]])
    data_scaled = scaler.transform(data)
    # Prédiction
    prob = model.predict_proba(data_scaled)[:, 1][0]
    return float(prob)