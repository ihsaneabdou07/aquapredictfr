import matplotlib.pyplot as plt
import pandas as pd
import numpy as np

# Chargement de vos données réelles
df = pd.read_csv('dataset_final.csv')

# Sélection d'une fenêtre de 100 points pour illustrer le bruit
# On se concentre sur le débit (Flow Rate)
data_subset = df['flow'].iloc[100:200].values
t = np.arange(len(data_subset))

# Simulation d'un signal "propre" (moyenne mobile sans bruit excessif)
# CORRECTION : Utilisation de bfill() au lieu de fillna(method='bfill')
signal_propre = pd.Series(data_subset).rolling(window=5).mean().bfill()

plt.figure(figsize=(10, 5))

# Plot des données réelles (le bruit de vos capteurs)
plt.plot(t, data_subset, label='Données réelles (Bruit capteur)', color='red', alpha=0.5)
# Plot du signal lissé (ce que l'IA tente d'analyser)
plt.plot(t, signal_propre, label='Signal filtré (Moyenne mobile)', color='green', linewidth=2)

# Mise en évidence d'une zone où le bruit rend la détection difficile
plt.axvspan(40, 60, color='yellow', alpha=0.3, label='Zone d\'incertitude (Bruit > Micro-fuite)')

plt.title('Défi : Analyse du bruit sur vos données réelles', fontsize=16)
plt.xlabel('Échantillons temporels', fontsize=12)
plt.ylabel('Débit (L/s)', fontsize=12)
plt.legend()
plt.grid(True, linestyle='--', alpha=0.5)

plt.tight_layout()
plt.savefig('sensor_challenges.png', dpi=300)
plt.show()