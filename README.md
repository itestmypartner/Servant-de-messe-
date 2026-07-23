# Servant-de-messe-

Site web des Servants de Messe de la paroisse Saint-Bernard d'Adiopodoumé.

## 📋 Pages

- **index.html** - Page d'accueil avec galerie photos et section actualités
- **inscription.html** - Formulaire d'inscription
- **admin.html** - Tableau de bord admin (inscriptions + actualités)
- **archive.html** - Archive complète des actualités

## 🎨 Styles

- **style.css** - Styles principaux (responsive, mobile-first)
- **news.css** - Styles pour la section actualités et l'admin

## 🔧 Architecture

### Frontend
- HTML5 sémantique
- CSS Grid/Flexbox responsive
- JavaScript vanilla (localStorage, sessionStorage)
- Mobil-first design

### Backend (Render)
- **server/index.js** - Express.js (Node 18.x)
- Serve fichiers statiques
- API `/api/publish-news` pour publier sur GitHub
- Authentification via PAT GitHub (env var `NEWS_PUBLISH_TOKEN`)

## 📱 Fonctionnalités

### Public
- Galerie 4 photos avec slider (prev/next + dots)
- Section actualités avec cards
- Archive page avec toutes les news
- Formulaire d'inscription (localStorage)
- Design responsive (desktop, tablet, mobile)

### Admin
- Connexion sécurisée (mot de passe en localStorage)
- Gestion inscriptions (voir, exporter CSV, supprimer)
- Gestion actualités (créer, modifier, supprimer, publier)
- Support articles avec ET sans images (base64)
- Export/Import JSON
- Dashboard statistiques

## 🚀 Déploiement

### Local
```bash
npm install
npm start
```
Service run sur http://localhost:3000

### Render
- URL: https://servant-de-messe-4651.onrender.com
- Env var `NEWS_PUBLISH_TOKEN` = GitHub PAT
- Auto-redeploy on main branch push

## 📝 Notes de configuration

### Password Admin
Stocké dans localStorage au premier accès.
Par défaut: `admin123`
Changeable via Settings dans l'admin.

### GitHub Publishing
- Publie dans `data/news.json` sur branch `main`
- Requiert PAT avec permissions `repo`
- PAT doit être dans Render env var `NEWS_PUBLISH_TOKEN`

### Images
- Inscription: pas d'images
- Actualités: images optionnelles
- Format: base64 dans localStorage et news.json

## 📦 Fichiers statiques

- `logoservantdemesse.jpg` - Logo principal
- `logoeglise.jpeg` - Logo église
- `photosdetouslegroupe.jpg` - Photo groupe
- `galerie-1.jpeg` à `galerie-4.jpeg` - Photos galerie

## 🔐 Sécurité

- Mot de passe admin en sessionStorage (30 min expiration)
- GitHub PAT jamais exposé au client
- Sanitisation HTML (escapeHtml)
- Validation form côté client

## ✅ Responsive Design

- 1100px+ : Desktop (2 colonnes)
- 768px-1099px : Tablette (1 colonne)
- 480px-767px : Téléphone
- <480px : Petit téléphone (optimized)

