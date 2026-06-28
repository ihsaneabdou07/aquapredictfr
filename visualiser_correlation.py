import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# Charger le dataset que vous avez généré avec clean_data.py
try:
    df = pd.read_csv('dataset_final.csv')
    
    # Calculer la corrélation
    corr_matrix = df.corr()
    
    # Visualiser la matrice
    plt.figure(figsize=(8, 6))
    sns.heatmap(corr_matrix, annot=True, cmap='coolwarm', fmt=".2f")
    plt.title("Matrice de Corrélation - Diagnostic Hydraulique")
    
    # Sauvegarder l'image pour l'ouvrir plus tard
    plt.savefig('correlation_heatmap.png')
    print("Matrice générée et sauvegardée sous 'correlation_heatmap.png'")
    
    # Afficher la fenêtre
    plt.show()
    
except Exception as e:
    print(f"Erreur lors de la génération : {e}")