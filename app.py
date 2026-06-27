from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from models.inference import get_leak_probability
from models.recorder import record_measurement, compute_horizon_label, compute_network_status

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

    # Supporte le format multi-capteurs (flow1/2/3, pressure1/2/3)
    # ou le format simple (flow, pressure) — rétrocompatibilité.
    flow1 = float(data.get("flow1", data.get("flow", 0)))
    flow2 = float(data.get("flow2", flow1))
    flow3 = float(data.get("flow3", flow1))
    pressure1 = float(data.get("pressure1", data.get("pressure", 0)))
    pressure2 = float(data.get("pressure2", pressure1))
    pressure3 = float(data.get("pressure3", pressure1))
    temp = float(data.get("temp", 18.5))

    # Moyennes pour le modèle ML
    flow = (flow1 + flow2 + flow3) / 3
    pressure = (pressure1 + pressure2 + pressure3) / 3

    probability = get_leak_probability(pressure, flow, temp)

    try:
        record_measurement(pressure=pressure, flow=flow, temperature=temp, probability=probability)
    except Exception:
        pass

    return {
        "leak_probability": probability,
        "sensors": {
            "flow": {"c1": flow1, "c2": flow2, "c3": flow3, "avg": round(flow, 3)},
            "pressure": {"c1": pressure1, "c2": pressure2, "c3": pressure3, "avg": round(pressure, 3)},
            "temperature": temp,
        }
    }

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