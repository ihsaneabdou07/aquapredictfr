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

# Pour tester en local avec : uvicorn app:app --reload