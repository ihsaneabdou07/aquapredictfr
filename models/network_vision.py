from ultralytics import YOLO
import json
import os
import logging

# Configuration du logging pour suivre les erreurs sans polluer la console
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def detect_network_components(image_path, model_path='yolov8n.pt', conf_threshold=0.5):
    """
    Analyse une image pour détecter les composants du réseau hydraulique.
    
    Modifications :
    - Paramétrage du chemin du modèle (pour basculer facilement vers 'best.pt').
    - Gestion robuste des erreurs.
    - Filtrage optionnel des classes.
    """
    if not os.path.exists(image_path):
        logger.error(f"Fichier image introuvable : {image_path}")
        return json.dumps({"error": "Image non trouvée"})

    try:
        # Chargement du modèle (auto-détection du device CPU/GPU)
        model = YOLO(model_path) 

        # Lancer la détection
        results = model.predict(source=image_path, conf=conf_threshold, verbose=False)
        
        detected_components = []
        
        for r in results:
            for box in r.boxes:
                # Extraction des données
                coords = box.xyxy[0].tolist() 
                cls_id = int(box.cls[0])
                name = model.names[cls_id]
                conf = float(box.conf[0])
                
                # Calcul du centre
                center_x = (coords[0] + coords[2]) / 2
                center_y = (coords[1] + coords[3]) / 2
                
                # Ajout des données structurées
                detected_components.append({
                    "component": name,
                    "confidence": round(conf, 2),
                    "bbox": [round(c, 1) for c in coords],
                    "center": {"x": round(center_x, 1), "y": round(center_y, 1)}
                })
                
        return detected_components # Retourne une liste Python, FastAPI le convertira en JSON
        
    except Exception as e:
        logger.error(f"Erreur lors de l'inférence : {str(e)}")
        return {"error": "Échec de l'analyse"}

if __name__ == "__main__":
    # Test unitaire simple
    image_file = "image_3e3123.png"
    resultat = detect_network_components(image_file)
    print(json.dumps(resultat, indent=4))