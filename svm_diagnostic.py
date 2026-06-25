import argparse
from typing import Dict, Optional

from models.inference import get_leak_probability


def build_comparison_report(
    pressure: float,
    flow: float,
    temp: float,
    expected_flow: Optional[float] = None,
    expected_pressure: Optional[float] = None,
    expected_temp: Optional[float] = None,
) -> Dict[str, str]:
    report = {}

    if expected_flow is not None:
        diff_flow = flow - expected_flow
        report["flow_comparison"] = (
            f"Débit mesuré = {flow:.2f}, cible = {expected_flow:.2f}, écart = {diff_flow:+.2f}."
        )
        report["flow_status"] = "OK" if abs(diff_flow) <= 5 else "Anormal"
    else:
        report["flow_comparison"] = "Aucune valeur cible fournie pour la comparaison de débit."
        report["flow_status"] = "Indéterminé"

    if expected_pressure is not None:
        diff_pressure = pressure - expected_pressure
        report["pressure_comparison"] = (
            f"Pression mesurée = {pressure:.2f}, cible = {expected_pressure:.2f}, écart = {diff_pressure:+.2f}."
        )
        report["pressure_status"] = "OK" if abs(diff_pressure) <= 0.5 else "Anormal"
    else:
        report["pressure_comparison"] = "Aucune valeur cible fournie pour la comparaison de pression."
        report["pressure_status"] = "Indéterminé"

    if expected_temp is not None:
        diff_temp = temp - expected_temp
        report["temperature_comparison"] = (
            f"Température mesurée = {temp:.2f}, cible = {expected_temp:.2f}, écart = {diff_temp:+.2f}."
        )
        report["temperature_status"] = "OK" if abs(diff_temp) <= 2 else "Anormal"
    else:
        report["temperature_comparison"] = "Aucune valeur cible fournie pour la comparaison de température."
        report["temperature_status"] = "Indéterminé"

    return report


def build_action_plan(leak_probability: float) -> Dict[str, str]:
    if leak_probability >= 0.85:
        return {
            "status": "Fuite probable",
            "recommendation": "Intervenir immédiatement : vérifier les tronçons à haute pression et débit, fermer les vannes de sectionnement."
        }
    if leak_probability >= 0.55:
        return {
            "status": "Fuite suspectée",
            "recommendation": "Programmer une intervention de maintenance rapide et vérifier les raccordements."
        }
    return {
        "status": "Réseau stable",
        "recommendation": "Continuer la surveillance. Aucune action immédiate nécessaire si les valeurs restent stables."
    }


def calculate_diagnostics(
    pressure: float,
    flow: float,
    temp: float,
    expected_flow: Optional[float] = None,
    expected_pressure: Optional[float] = None,
    expected_temp: Optional[float] = None,
    threshold: float = 0.5,
) -> Dict[str, object]:
    probability = get_leak_probability(pressure, flow, temp)
    comparison = build_comparison_report(
        pressure,
        flow,
        temp,
        expected_flow=expected_flow,
        expected_pressure=expected_pressure,
        expected_temp=expected_temp,
    )
    action = build_action_plan(probability)

    diagnostics = {
        "pressure": pressure,
        "flow": flow,
        "temperature": temp,
        "leak_probability": probability,
        "threshold": threshold,
        "svm_status": action["status"],
        "recommendation": action["recommendation"],
        "comparison": comparison,
        "diagnostic_summary": (
            "Fuite probable" if probability >= threshold else "Fonctionnement normal"
        ),
    }

    return diagnostics


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Calculer la probabilité de fuite et le diagnostic SVM.")
    parser.add_argument("--pressure", type=float, required=True, help="Pression mesurée (bar).")
    parser.add_argument("--flow", type=float, required=True, help="Débit mesuré (L/s).")
    parser.add_argument("--temp", type=float, default=18.5, help="Température mesurée (°C).")
    parser.add_argument("--expected-flow", type=float, help="Débit cible pour comparaison.")
    parser.add_argument("--expected-pressure", type=float, help="Pression cible pour comparaison.")
    parser.add_argument("--expected-temp", type=float, help="Température cible pour comparaison.")
    parser.add_argument("--threshold", type=float, default=0.5, help="Seuil de probabilité pour le diagnostic de fuite.")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    diagnostics = calculate_diagnostics(
        pressure=args.pressure,
        flow=args.flow,
        temp=args.temp,
        expected_flow=args.expected_flow,
        expected_pressure=args.expected_pressure,
        expected_temp=args.expected_temp,
        threshold=args.threshold,
    )

    print("=== Diagnostic SVM AquaPredict ===")
    print(f"Pression : {diagnostics['pressure']:.2f} bar")
    print(f"Débit : {diagnostics['flow']:.2f} L/s")
    print(f"Température : {diagnostics['temperature']:.2f} °C")
    print(f"Probabilité de fuite : {diagnostics['leak_probability']:.3f}")
    print(f"Statut SVM : {diagnostics['svm_status']}")
    print(f"Résumé : {diagnostics['diagnostic_summary']}")
    print(f"Recommandation : {diagnostics['recommendation']}")
    print("\n--- Comparaison des mesures ---")
    for key, value in diagnostics["comparison"].items():
        print(f"{key.replace('_', ' ').capitalize()} : {value}")
