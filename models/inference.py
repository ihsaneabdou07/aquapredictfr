import joblib
import os
import numpy as np

# Chargement sécurisé
model_path = os.path.join(os.path.dirname(__file__), 'leak_detection_model.pkl')
scaler_path = os.path.join(os.path.dirname(__file__), 'scaler.pkl')

model = joblib.load(model_path)
scaler = joblib.load(scaler_path)

# Pour calculer les moyennes mobiles, on a besoin d'un historique.
# Comme votre API est "stateless", on utilise une valeur par défaut ou 
# on simplifie si on n'a pas l'historique complet des 5 derniers points.
def get_leak_probability(pressure, flow, temp):
    # Vous devez fournir les 6 features attendues par le scaler
    # Si vous n'avez pas l'historique, on utilise les valeurs actuelles pour les "mean_5"
    features = [
        pressure, flow, temp,  # Les 3 originales
        pressure, flow, temp   # Les 3 "mean_5" (approximation)
    ]
    
    data = np.array([features])
    
    # Transformation des données
    data_scaled = scaler.transform(data)
    
    # Prédiction
    # model.predict_proba retourne [prob_sain, prob_fuite]
    # On prend la colonne 1 (Fuite)
    prob = model.predict_proba(data_scaled)[:, 1][0]
    return float(prob)