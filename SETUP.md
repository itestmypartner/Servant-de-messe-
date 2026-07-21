# Configuration pour GitHub Pages

Pour activer le déploiement automatique sur GitHub Pages :

1. Va dans **Settings** du dépôt
2. Sélectionne **Pages** (à gauche)
3. Choisis **Source**: branch `main`
4. Clique sur **Save**

La page sera accessible à : `https://itestmypartner.github.io/Servant-de-messe`

---

# Page d'inscription

**Adresse** : `/inscription.html`

Les inscriptions sont **stockées en local** dans le navigateur (localStorage).

### Fonctionnalités
- Formulaire avec nom, prénom, âge, téléphone
- Validation des champs
- Toast notifications (succès/erreur)
- Mask téléphone automatique (+225 XXXXXXXXXX)
- Lien de retour à l'accueil

---

# Page Admin (CACHÉ)

**Adresse** : `/admin.html`

**Mot de passe par défaut** : `200700`

### Accès
- La page est **accessible publiquement** mais protégée par un mot de passe
- L'URL n'est **pas mentionnée** sur le site principal (reste caché)
- Chaque navigateur conserve sa session (déconnexion avec bouton "Déconnexion")

### Fonctionnalités de l'admin
- ✅ Affichage de toutes les inscriptions dans un tableau
- ✅ Suppression individuelle d'une inscription
- ✅ Export CSV des inscriptions (téléchargement)
- ✅ Changement du mot de passe (paramètres)
- ✅ Suppression de toutes les inscriptions (paramètres)
- ✅ Compteur total d'inscriptions

### Utilisation
1. Va sur `https://itestmypartner.github.io/Servant-de-messe/admin.html`
2. Entre le mot de passe : `200700`
3. Clique sur "Accéder"
4. Gère les inscriptions

---

# Changer le mot de passe

Dans la page admin :
1. Clique sur le bouton ⚙️ **Paramètres**
2. Dans la section "Changer le mot de passe"
3. Entre le mot de passe actuel, puis le nouveau
4. Confirme et clique "Mettre à jour"

Le nouveau mot de passe est **sauvegardé localement** et persiste.

---

# Télécharger les inscriptions (CSV)

Dans la page admin :
1. Clique sur le bouton 📥 **Télécharger CSV**
2. Un fichier `inscriptions-YYYY-MM-DD.csv` se télécharge
3. Ouvre avec Excel, Google Sheets ou tout logiciel compatible

---

# Notes importantes

⚠️ **Limitation actuelle** : Les données sont stockées **dans le navigateur** de chaque ordinateur/appareil.
- Si on accède à l'admin depuis un autre PC, les inscriptions ne seront pas visibles
- Seules les inscriptions collectées sur **cet ordinateur** s'affichent

**Solution future** (optionnelle) :
- Utiliser une base de données (Firebase, Supabase, etc.)
- Mettre en place un backend avec Node.js/Python
- Pour maintenant, c'est stocké localement et fonctionne bien sur un poste admin unique

---

# Autres

- ✅ Formspree supprimé
- ✅ Google Analytics placeholder conservé (à configurer si besoin)
- ✅ Lien admin **non visible** sur la page d'accueil (reste secret)
