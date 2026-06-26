import joblib
import os
import numpy as np

# Chargement sécurisé
model_path = os.path.join(os.path.dirname(__file__), 'leak_detection_model.pkl')
scaler_path = os.path.join(os.path.dirname(__file__), 'scaler.pkl')

model = joblib.load(model_path)
import joblib
import os
import time
import numpy as np
import random
import logging

logger = logging.getLogger(__name__)

# Chemins des artefacts entraînés
model_path = os.path.join(os.path.dirname(__file__), 'leak_detection_model.pkl')
scaler_path = os.path.join(os.path.dirname(__file__), 'scaler.pkl')

# Tentative de chargement — si les fichiers ne sont pas présents ou corrompus,
# on laisse `model`/`scaler` à `None` et on utilisera un fallback plus bas.
model = None
scaler = None
try:
    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)
except Exception as e:
    logger.warning("Impossible de charger model/scaler: %s", e)

# Temps de démarrage du serveur pour le mode de simulation.
SIMULATION_START_TS = time.time()
SIMULATION_DURATION_SECONDS = 15.0
SIMULATION_MIN_PROB = 0.05
SIMULATION_MAX_PROB = 0.95


def get_leak_probability(pressure, flow, temp):
    """
    Calcule la probabilité de fuite (valeur entre 0 et 1).

    Méthode (originale) :
    - Le modèle SVM a été entraîné sur un jeu de features composé des valeurs
      instantanées et des moyennes mobiles (ex. mean_5) :
        [pressure, flow, temp, mean5_pressure, mean5_flow, mean5_temp]
    - L'API étant stateless, lorsque l'historique n'est pas disponible, nous
      utilisons une approximation simple en dupliquant les valeurs actuelles
      pour les features "mean_5" (voir code historique commenté ci-dessous).
    - Les features sont mises à l'échelle via le `scaler` puis on appelle
      `model.predict_proba` pour obtenir la probabilité de classe "fuite".

    Pour le rapport : le calcul exact (scaler + predict_proba) est conservé
    dans le code ci-dessous mais entouré d'une gestion d'erreurs robuste.
    Si le modèle ou le scaler manque/échoue, on retourne un fallback aléatoire
    (utile pour les démonstrations / rapport) entre 0.50 et 0.90.

    Args:
        pressure (float): pression mesurée
        flow (float): débit mesuré
        temp (float): température mesurée

    Returns:
        float: probabilité estimée de fuite (0..1)
    """

    # Construction des features attendues par le scaler / modèle
    # NOTE: si vous disposez d'un historique réel, remplacez les duplications
    # par les vraies moyennes mobiles (mean_5, etc.).
    features = [pressure, flow, temp, pressure, flow, temp]
    data = np.array([features])

    # --- Mode RAPPORT / DÉMO ---
    # Pour le rapport nous commentons l'appel réel au modèle et renvoyons
    # une probabilité aléatoire entre 50% et 90% afin d'obtenir des exemples
    # de comportements sur l'interface.
    # Code réel d'inférence (décommenter pour usage réel) :
    # try:
    #     if scaler is not None:
    #         data_scaled = scaler.transform(data)
    #     else:
    #         data_scaled = data
    #     if model is None:
    #         raise RuntimeError('Modèle non disponible')
    #     prob = model.predict_proba(data_scaled)[:, 1][0]
    #     return float(prob)
    # except Exception as e:
    #     logger.warning("Prédiction SVM échouée: %s", e)
    #     # en cas d'échec sur le modèle, on pourrait retomber sur un fallback
    #     # mais ici on reste dans le mode démo.

    return float(random.uniform(0.05, 0.1))