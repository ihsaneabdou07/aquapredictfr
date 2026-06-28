import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# Charger le jeu de données
# Assurez-vous que le fichier est accessible dans votre environnement
df = pd.read_csv('water_leak_detection_1000_rows.csv')

# Sélectionner uniquement les colonnes numériques pour la corrélation
# Vous pouvez ajuster cette liste en fonction des colonnes présentes dans votre CSV
# qui correspondent aux données structurelles, opérationnelles et environnementales
data_corr = df.select_dtypes(include=['float64', 'int64'])

# Calculer la matrice de corrélation
correlation_matrix = data_corr.corr()

# Visualisation
plt.figure(figsize=(12, 10))
sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm', fmt=".2f")
plt.title('Matrice de Corrélation - AquaPredict')
plt.show()