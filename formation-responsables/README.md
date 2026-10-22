# 📖 Emploi du Temps des Formations
### Servants de Messe — Paroisse Saint-Bernard d'Adiopodoumé

Site officiel de gestion et de consultation de l'emploi du temps des formations du samedi pour les servants d'autel.

**Responsable Chargé de la Formation : DJEBLE Haniel** — 01 50 25 24 67

---

## 🚀 Comment l'ouvrir ?

- **En ligne (recommandé)** : via le site paroissial hébergé sur Render.
- **En local** : double-cliquez sur `index.html`, ou via `http://localhost:3000/formation-responsables/` avec le serveur Node lancé.

---

## ✨ Fonctionnalités

1. **Planning synchronisé en temps réel** :
   - Les séances saisies par le responsable sont enregistrées sur le serveur (`/api/formations`) et **visibles par tous les visiteurs**, sur tous les appareils.
   - `localStorage` sert de cache hors-ligne.

2. **Prochaine séance mise en avant** :
   - Carte dédiée avec compte à rebours (« Aujourd'hui », « Demain », « Dans X jours »).

3. **Deux modes d'affichage** :
   - 📋 **Vue Liste** : tableau détaillé (desktop) et cartes ergonomiques (mobile).
   - �️ **Vue Calendrier** : grille mensuelle, samedis surlignés, jour actuel encadré. En mode responsable, un clic sur un samedi pré-remplit le formulaire de séance.

4. **Filtres par niveau** : Tous, **Postulant**, **Samuel**, **Tarcisius**, **Augustin** + statistiques par niveau pour le mois affiché.

5. **Programme détaillé des 4 niveaux** : cliquez sur une carte de niveau pour voir les modules enseignés, la durée indicative et les critères de passage.

6. **Partage & rappels** :
   - Message WhatsApp pré-formaté (planning complet ou séance individuelle).
   - **Ajout au calendrier** : fichier `.ics` (Apple, Outlook) ou lien Google Agenda par séance.

7. **Impression** :
   - Planning A4 officiel avec en-tête paroissial et visa du responsable.
   - **Fiche de présence imprimable** par séance (liste des inscrits pré-remplie si connecté, sinon lignes vierges).

8. **Espace Responsable** :
   - Connexion par mot de passe vérifié côté serveur (jamais affiché dans la page).
   - Ajout, modification, suppression de séances ; **récurrence** « tous les samedis restants du mois » ; **duplication** du planning du mois précédent.
   - Gestion du corps des formateurs.
   - **Changement du mot de passe** depuis le bouton « Sécurité ».

9. **PWA** : installable sur téléphone (écran d'accueil), fonctionnement hors-ligne partiel via service worker.

---

## 🔧 API (serveur Render)

| Méthode | Route | Accès |
|---|---|---|
| `GET` | `/api/formations` | Public |
| `PUT` | `/api/formations` | Responsable (`x-admin-password`) |
| `POST` | `/api/admin/verify` | Public (rate-limité) |
| `POST` | `/api/admin/change-password` | Responsable |

Données persistées dans `data/formations.json` (dépôt GitHub) ; hash du mot de passe dans `data/config.json`.
