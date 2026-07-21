# Configuration pour GitHub Pages

Pour activer le déploiement automatique sur GitHub Pages :

1. Va dans **Settings** du dépôt
2. Sélectionne **Pages** (à gauche)
3. Choisis **Source**: branch `main`
4. Clique sur **Save**

La page sera accessible à : `https://itestmypartner.github.io/Servant-de-messe-`

---

# Configuration Formspree

Pour recevoir les inscriptions par email :

1. Va sur https://formspree.io
2. Crée un compte gratuit
3. Ajoute un nouveau formulaire pour `https://itestmypartner.github.io/Servant-de-messe-/inscription.html`
4. Récupère l'ID du formulaire (exemple: `f/abc123def`)
5. Remplace `XXXXXXXXXX` dans le fichier `inscription.html` ligne 38 par cet ID

Exemple :
```html
<form action="https://formspree.io/f/mkyzvwdz" method="post">
```

---

# Configuration Google Analytics

Pour suivre les visiteurs et les inscriptions :

1. Va sur https://analytics.google.com
2. Crée une propriété pour le dépôt
3. Récupère ton ID de mesure (format: `G-XXXXXXXXXX`)
4. Remplace `G-XXXXXXXXXX` dans `inscription.html` aux lignes 11 et 12

---

# Optimisation image

Pour générer une version WebP du logo :

```bash
# Avec ImageMagick (installé)
convert logoservantdemesse.jpg -quality 80 logoservantdemesse.webp

# Ou utiliser un outil online: https://convertio.co/jpg-webp/
```

Puis pousse le fichier `logoservantdemesse.webp` dans le dépôt.

---

# Améliorations appliquées

✅ 1. Formspree intégré (sans backend)
✅ 2. Mask du téléphone (+225 XXXXXXXXXX) en temps réel
✅ 3. Toast notifications (succès/erreur, visible bottom-right)
✅ 4. Ombre réduite de la carte (plus moderne)
✅ 5. Image responsive avec WebP fallback
✅ 6. Lien "Retour à l'accueil"
✅ 7. Meta title/description et Open Graph
✅ 8. Autocomplete sur tous les inputs
✅ 9. Google Analytics intégré (événement `generate_lead`)
✅ 10. GitHub Pages prêt (instructions ci-dessus)
