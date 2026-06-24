import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from imblearn.over_sampling import SMOTE
from sklearn.metrics import classification_report, accuracy_score
from sklearn.calibration import calibration_curve, CalibratedClassifierCV
import joblib
import os

# ==========================================
# 1. PRÉPARATION ET VISUALISATION INITIALE
# ==========================================
# Utilisation du nom de fichier correct
df = pd.read_csv('water_leak_detection_1000_rows.csv')
df['Timestamp'] = pd.to_datetime(df['Timestamp'])
df = df.sort_values('Timestamp')

# Feature Engineering : Moyenne mobile sur 5 points
features_physiques = ['Pressure (bar)', 'Flow Rate (L/s)', 'Temperature (°C)']
for col in features_physiques:
    df[f'{col}_mean_5'] = df[col].rolling(window=5).mean()

df = df.dropna().reset_index(drop=True)

X = df.drop(columns=['Timestamp', 'Sensor_ID', 'Leak Status', 'Burst Status'])
y = df['Leak Status']

# Split 70/30
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.30, random_state=42, stratify=y)

# Standardisation
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Équilibrage par SMOTE
sm = SMOTE(random_state=42)
X_train_resampled, y_train_resampled = sm.fit_resample(X_train_scaled, y_train)

# ==========================================
# 2. ENTRAÎNEMENT AVEC CALIBRATION
# ==========================================
print("Entraînement du SVM avec calibration...")
base_svm = SVC(kernel='rbf', probability=True, random_state=42)
model_svm = CalibratedClassifierCV(estimator=base_svm, method='sigmoid', cv=5)
model_svm.fit(X_train_resampled, y_train_resampled)

# Prédictions
y_pred = model_svm.predict(X_test_scaled)
probs = model_svm.predict_proba(X_test_scaled)[:, 1]

# ==========================================
# 3. BILAN ET SAUVEGARDE
# ==========================================
report = classification_report(y_test, y_pred, target_names=['Sain', 'Fuite'], output_dict=True)

print("\n" + "="*60)
print("        BILAN FINAL : DÉTECTION DES FUITES D'EAU (SVM CALIBRÉ)")
print("="*60)
print(f"Précision Globale : {accuracy_score(y_test, y_pred)*100:.2f}%")
print(f"Rappel Fuites     : {report['Fuite']['recall']*100:.1f}%")

# Création du dossier models/ s'il n'existe pas
if not os.path.exists('models'):
    os.makedirs('models')

# Sauvegarde finale
joblib.dump(model_svm, 'models/leak_detection_model.pkl')
joblib.dump(scaler, 'models/scaler.pkl')

print("\nSuccès : Modèle et scaler sauvegardés dans le dossier 'models/'.")
print("="*60)