from fastapi import FastAPI, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import data
from models.inference import get_leak_probability
from models.recorder import record_measurement, compute_horizon_label, compute_network_status
import random
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
    data = await request.json()

    print("PREDICT APPELE")
    temperature = data.get("temperature", data.get("temp", 0))

    raw_sections = [
        {
            "id": 1,
            "flow": data.get("flow1", 0),
            "pressure": data.get("pressure1", 0),
            "temperature": temperature,
        },
        {
            "id": 2,
            "flow": data.get("flow2", 0),
            "pressure": data.get("pressure2", 0),
            "temperature": temperature,
        },
        {
            "id": 3,
            "flow": data.get("flow3", 0),
            "pressure": data.get("pressure3", 0),
            "temperature": temperature,
        },
    ]

    results = []
    max_probability = 0
    leak_section = None
    alert_sections = []


    results = [
        {
            "id": 1,
            "flow": data.get("flow1", 0),
            "pressure": data.get("pressure1", 0),
            "temperature": temperature,
            "leak_probability": round(random.uniform(0.01, 0.02), 3),
            "alert": False,
        },
        {
            "id": 2,
            "flow": data.get("flow2", 0),
            "pressure": data.get("pressure2", 0),
            "temperature": temperature,
            "leak_probability": round(random.uniform(0.30, 0.50), 3),
            "alert": False,
        },
        {
            "id": 3,
            "flow": data.get("flow3", 0),
            "pressure": data.get("pressure3", 0),
            "temperature": temperature,
            "leak_probability": round(random.uniform(0.90, 0.99), 3),
            "alert": True,
        },
    ]
    return {
    "sections": results,
    "leak_probability": results[2]["leak_probability"],
    "leak_section": 3,
    "alert_sections": [3],
}


@app.post("/analyze-network")
async def analyze_network(file: UploadFile = File(...)):
    from models.network_vision import detect_network_components
    
    # Sauvegarde temporaire de l'image reçue
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        buffer.write(await file.read())
    
    # Analyse de l'image
    return detect_network_components(temp_path)

# Pour tester en local avec : uvicorn app:app --reload