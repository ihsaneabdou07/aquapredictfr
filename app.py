from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from models.inference import get_leak_probability

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/predict")
async def predict(request: Request):
    # Récupération du JSON envoyé par Supabase
    data = await request.json()
    
    # Extraction des paramètres
    pressure = float(data.get("pressure"))
    flow = float(data.get("flow"))
    temp = float(data.get("temp", 18.5)) # Valeur par défaut 18.5 si non fourni
    
    # Appel à votre modèle
    probability = get_leak_probability(pressure, flow, temp)
    
    return {"leak_probability": probability}

from fastapi import UploadFile, File
from models.network_vision import detect_network_components

@app.post("/analyze-network")
async def analyze_network(file: UploadFile = File(...)):
    # Sauvegarde temporaire de l'image reçue
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        buffer.write(await file.read())
    
    # Analyse de l'image
    return detect_network_components(temp_path)

# Pour tester en local avec : uvicorn app:app --reload