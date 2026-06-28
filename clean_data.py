import pandas as pd
import re

def clean_txt_file(file_path, leak_status):
    # Pour le fichier sain (texte brut)
    data = []
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            match = re.search(r"Débit:\s*([\d\.]+).*?Pression:\s*([\d\.]+).*?Température:\s*([\d\.]+)", line)
            if match:
                data.append({'flow': float(match.group(1)), 'pressure': float(match.group(2)), 'temperature': float(match.group(3)), 'is_leak': leak_status})
    return pd.DataFrame(data)

# 1. Nettoyer le sain
df_sain = clean_txt_file('data_logs/pas_de_fuite_sain.txt', 0)

# 2. Nettoyer la fuite (CSV)
# On utilise header=None car il n'y a pas de noms de colonnes dans le fichier
df_fuite = pd.read_csv('data_logs/fuite sure.txt', skiprows=1, header=None)

# Selection des colonnes d'intérêt (basé sur votre affichage)
# Colonne 1: Flow, Colonne 2: Pressure, Colonne 3: Temp
df_fuite = df_fuite[[1, 2, 3]]
df_fuite.columns = ['flow', 'pressure', 'temperature']
df_fuite['is_leak'] = 1

# 3. Fusionner
df_final = pd.concat([df_sain, df_fuite], ignore_index=True)
df_final.to_csv('dataset_final.csv', index=False)
print(f"Dataset créé ! Lignes saines : {len(df_sain)}, Fuites : {len(df_fuite)}")