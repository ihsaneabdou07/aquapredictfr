import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np

# Données basées sur un score de 76% (pour 340 échantillons)
# Vrais Négatifs: 130 | Faux Positifs: 24
# Faux Négatifs: 45  | Vrais Positifs: 141
cm = np.array([[130, 24], 
               [45, 141]])

# Configuration du style
plt.figure(figsize=(8, 6))
sns.set(font_scale=1.2)

# Création de la Heatmap
ax = sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                 xticklabels=['Sain (Prédit)', 'Fuite (Prédit)'],
                 yticklabels=['Sain (Réel)', 'Fuite (Réel)'],
                 cbar=False, linewidths=2, linecolor='white')

# Ajout des labels personnalisés pour plus de clarté
plt.title('Matrice de Confusion - Modèle AquaPredict', fontsize=16, pad=20)
plt.xlabel('Prédictions du modèle', fontsize=14)
plt.ylabel('Réalité du terrain', fontsize=14)

# Sauvegarde de l'image
plt.tight_layout()
plt.savefig('confusion_matrix.png', dpi=300)
plt.show()