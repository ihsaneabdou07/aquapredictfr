import os
import csv
import json
from datetime import datetime
from typing import Dict, Any


LOG_DIR = os.path.join(os.path.dirname(__file__), '..', 'data_logs')
CSV_PATH = os.path.join(LOG_DIR, 'measurements.csv')
JSONL_PATH = os.path.join(LOG_DIR, 'measurements.jsonl')


def _ensure_log_dir() -> None:
    os.makedirs(LOG_DIR, exist_ok=True)


def compute_horizon_label(prob: float) -> str:
    if prob is None:
        return 'N/A'
    if prob >= 0.85:
        return 'Fuite imminente (≤6h)'
    if prob >= 0.7:
        return 'Risque élevé (≤12h)'
    if prob >= 0.5:
        return 'Surveillance renforcée (≤24h)'
    if prob >= 0.3:
        return 'Surveillance requise (≤48h)'
    return 'Réseau stable (aucune fuite anticipée)'


def compute_network_status(prob: float) -> str:
    if prob is None:
        return 'pending'
    if prob >= 0.85:
        return 'critical'
    if prob >= 0.7:
        return 'warning'
    if prob >= 0.5:
        return 'info'
    return 'normal'


def _write_csv_row(row: Dict[str, Any]) -> None:
    _ensure_log_dir()
    file_exists = os.path.exists(CSV_PATH)
    with open(CSV_PATH, 'a', newline='', encoding='utf-8') as csvfile:
        fieldnames = [
            'timestamp', 'pressure', 'flow', 'temperature', 'probability',
            'horizon_label', 'network_status'
        ]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        if not file_exists:
            writer.writeheader()
        writer.writerow({k: row.get(k, '') for k in fieldnames})


def _write_jsonl(row: Dict[str, Any]) -> None:
    _ensure_log_dir()
    with open(JSONL_PATH, 'a', encoding='utf-8') as jf:
        jf.write(json.dumps(row, ensure_ascii=False) + '\n')


def record_measurement(pressure: float, flow: float, temperature: float, probability: float | None, extra: Dict[str, Any] | None = None) -> None:
    """Enregistre la mesure et les statistiques calculées en CSV et JSONL.

    Args:
        pressure: pression mesurée
        flow: débit mesuré
        temperature: température mesurée
        probability: probabilité renvoyée par le modèle (0..1) ou None
        extra: dictionnaire optionnel avec informations supplémentaires
    """
    ts = datetime.utcnow().isoformat() + 'Z'
    prob_val = None if probability is None else float(probability)
    horizon = compute_horizon_label(prob_val) if prob_val is not None else 'N/A'
    network = compute_network_status(prob_val) if prob_val is not None else 'pending'

    row = {
        'timestamp': ts,
        'pressure': pressure,
        'flow': flow,
        'temperature': temperature,
        'probability': prob_val,
        'horizon_label': horizon,
        'network_status': network,
    }

    if extra:
        # merge extras into row for JSONL but keep CSV columns stable
        row = {**row, **extra}

    try:
        _write_csv_row(row)
        _write_jsonl(row)
    except Exception:
        # Ne jamais faire planter le serveur pour un problème d'I/O de logs
        pass
