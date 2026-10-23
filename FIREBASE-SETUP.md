# Configuration Firebase — SMSB

La plateforme utilise Firebase (projet **smsb-9a9ec**) au lieu du serveur Render + GitHub.

## Étapes dans la console Firebase

### 1. Activer Firestore
Console → **Build → Firestore Database** → « Créer une base de données » → mode **production** → région `eur3` (Europe).

### 2. Activer l'authentification
**Build → Authentication → Sign-in method** → activer **Email/Password**.

Puis **Authentication → Users → Add user** : créez au moins un compte responsable
(ex. `haniel@smsb.com` + mot de passe de votre choix).
Ce compte servira pour l'Espace Responsable, l'admin, et le trésorier.

### 3. Coller les règles de sécurité
**Firestore Database → Règles** → remplacez tout par le contenu du fichier
[`firestore.rules`](./firestore.rules) → **Publier**.

Résumé des règles :

| Collection | Lecture | Écriture |
|---|---|---|
| `news`, `sessions`, `trainers`, `services` | publique | responsables connectés |
| `servants`, `presences`, `expenses`, `config` | responsables uniquement | responsables uniquement |
| `inscriptions` | responsables uniquement | création publique (formulaire) |

### 4. Première connexion
À la première connexion dans l'Espace Responsable, l'application importe
automatiquement : les **42 servants**, les **11 responsables** et les
**postes de messe** par défaut.

## Collections Firestore

- `servants` — profil par servant (nom, niveau, compétences, tél, note, actif)
- `trainers` — responsables/formateurs
- `sessions` — séances de formation du samedi
- `presences` — un document par séance : appel du samedi
- `services` — services de messe + attributions par poste
- `config/postes` — liste des postes (compétences)
- `news` — actualités publiques
- `inscriptions` — inscriptions au groupe
- `expenses` — dépenses du trésorier
