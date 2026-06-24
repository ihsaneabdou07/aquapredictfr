import joblib
import numpy as np

# Chargement du modèle et du scaler
model = joblib.load('models/leak_detection_model.pkl')
scaler = joblib.load('models/scaler.pkl')

def get_leak_probability(pressure, flow, temp):
    # Transformation des données brutes
    data = np.array([[pressure, flow, temp]])
    data_scaled = scaler.transform(data)
    
    # Calcul de la probabilité
    prob = model.predict_proba(data_scaled)[:, 1][0]
    return float(prob)