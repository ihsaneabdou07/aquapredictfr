import pandas as pd
import joblib
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline


# 1. Charger les données
df = pd.read_csv('dataset_final.csv')

# 2. Recalculer les moyennes mobiles
df['Flow Rate (L/s)_mean_5'] = df['flow'].rolling(window=5).mean().fillna(0)
df['Pressure (bar)_mean_5'] = df['pressure'].rolling(window=5).mean().fillna(0)
df['Temperature (°C)_mean_5'] = df['temperature'].rolling(window=5).mean().fillna(0)

# IMPORTANT : Renommer pour correspondre à la logique "propre" du scaler
df = df.rename(columns={
    'flow': 'Flow Rate (L/s)', 
    'pressure': 'Pressure (bar)', 
    'temperature': 'Temperature (°C)'
})

# Sélection des 6 colonnes dans l'ordre
colonnes = [
    'Flow Rate (L/s)', 'Flow Rate (L/s)_mean_5', 
    'Pressure (bar)', 'Pressure (bar)_mean_5', 
    'Temperature (°C)', 'Temperature (°C)_mean_5'
]

X = df[colonnes]
y = df['is_leak']

# 3. Entraînement avec StandardScaler et SVC (RBF optimisé)
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# On force le scaler à mémoriser les noms des colonnes
# Cela évitera les erreurs "Feature names unseen" dans evaluer_modele.py
feature_names = X.columns.tolist()
# Note : StandardScaler n'a pas de 'feature_names_in_' direct, 
# on le stockera à côté si besoin, mais ici le 'fit' sur un DataFrame suffit.


# Cela aide le modèle à mieux gérer les différences d'échelle entre vos fichiers

model = make_pipeline(StandardScaler(), SVC(kernel='rbf', C=10, gamma='scale', class_weight='balanced'))
model.fit(X, y)


# 4. Sauvegarder
joblib.dump(model, 'models/leak_detection_model.pkl')
joblib.dump(scaler, 'models/scaler.pkl')

print("Modèle réentraîné avec succès avec le noyau RBF et class_weight='balanced' !")