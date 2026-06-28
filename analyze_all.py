import pandas as pd
import re
import os
import seaborn as sns
import matplotlib.pyplot as plt

def collect_data():
    data = []
    # Dossiers à scanner
    for root, dirs, files in os.walk("."):
        for filename in files:
            path = os.path.join(root, filename)
            
            # Traitement des fichiers "sains" (texte avec émojis)
            if 'sain' in filename.lower() and filename.endswith('.txt'):
                with open(path, 'r', encoding='utf-8') as f:
                    for line in f:
                        match = re.search(r"Débit:\s*([\d\.]+).*?Pression:\s*([\d\.]+).*?Température:\s*([\d\.]+)", line)
                        if match:
                            data.append({'flow': float(match.group(1)), 'pressure': float(match.group(2)), 'temperature': float(match.group(3)), 'is_leak': 0})
            
            # Traitement des fichiers "fuite" (CSV)
            elif 'fuite' in filename.lower() and filename.endswith('.txt'):
                try:
                    df_temp = pd.read_csv(path)
                    df_temp['is_leak'] = 1
                    # Normalisation des noms de colonnes
                    df_temp = df_temp.rename(columns={'flow_rate': 'flow'})
                    data.extend(df_temp[['pressure', 'flow', 'temperature', 'is_leak']].to_dict('records'))
                except:
                    continue
    return pd.DataFrame(data)

# 1. Collecte et nettoyage
df = collect_data()
if df.empty:
    print("ERREUR : Aucune donnée trouvée. Vérifiez que vos fichiers contiennent bien les mots 'sain' ou 'fuite'.")
else:
    df.to_csv('dataset_final.csv', index=False)
    print(f"Dataset créé avec {len(df)} lignes.")

    # 2. Visualisation
    corr = df.corr()
    plt.figure(figsize=(8,6))
    sns.heatmap(corr, annot=True, cmap='coolwarm')
    plt.title("Matrice de Corrélation - Diagnostic")
    plt.show()