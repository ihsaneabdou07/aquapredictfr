import joblib
import os
import numpy as np
import logging

logger = logging.getLogger(__name__)

# Chargement des artefacts entraînés
model_path = os.path.join(os.path.dirname(__file__), 'leak_detection_model.pkl')
scaler_path = os.path.join(os.path.dirname(__file__), 'scaler.pkl')

model = None
scaler = None
try:
    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)
except Exception as e:
    logger.warning("Impossible de charger model/scaler: %s", e)


def get_leak_probability(pressure, flow, temp):
    """
    Calcule la probabilité de fuite (valeur entre 0 et 1) via le modèle SVM entraîné.

    Méthode :
    - Le modèle SVM utilise 6 features : [pressure, flow, temp, mean5_pressure, mean5_flow, mean5_temp]
    - L'API étant stateless, nous utilisons les valeurs actuelles pour les features "mean_5"
    - Les features sont mises à l'échelle via le `scaler`
    - Appel à `model.predict_proba` pour obtenir la probabilité de classe "fuite"

    Args:
        pressure (float): pression mesurée
        flow (float): débit mesuré
        temp (float): température mesurée

    Returns:
        float: probabilité estimée de fuite (0..1)
    """
    
    # Construction des features : [pressure, flow, temp, mean5_pressure, mean5_flow, mean5_temp]
    features = [pressure, flow, temp, pressure, flow, temp]
    data = np.array([features])

    try:
        if scaler is None or model is None:
            raise RuntimeError('Modèle ou scaler non disponible')
        
        data_scaled = scaler.transform(data)
        # model.predict_proba retourne [prob_sain, prob_fuite] - on prend la colonne 1 (fuite)
        prob = model.predict_proba(data_scaled)[:, 1][0]
        return float(prob)
    
    except Exception as e:
        logger.error("Erreur lors du calcul de probabilité: %s", e)
        # En cas d'erreur, retourner 0 (aucune fuite détectée)
        return 0.0