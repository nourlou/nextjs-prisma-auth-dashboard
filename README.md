# TP2 — Gestion des rôles et contrôle d'accès

Next.js 15 (App Router) · TypeScript · Prisma 6 · SQLite · bcryptjs · jose · Zod · Tailwind.
Suite du TP1 (authentification). **Une seule table : `User`.** Un « étudiant » est un `User` dont `role = "ETUDIANT"`.

## Installation

```bash
npm install                 # installe et génère le client Prisma
npx prisma migrate dev      # applique les migrations (init + add_user_role) -> prisma/dev.db
npm run db:seed             # crée 1 admin, 1 enseignant, 3 étudiants
npm run dev                 # http://localhost:3000
npx prisma studio           # explorer la table User
```

Le fichier `.env` fourni contient un `JWT_SECRET` de développement. Il est exclu de Git (`.gitignore`) ;
copiez `.env.example` et générez votre propre secret : `openssl rand -base64 48`.

### Comptes de démonstration (mot de passe : `Password123`)

| Rôle | Email |
|---|---|
| ADMIN | admin@test.com |
| ENSEIGNANT | enseignant@test.com |
| ETUDIANT | etudiant1@test.com, etudiant2@test.com, etudiant3@test.com |

## Migrations

- `20261105090000_init` : table `User` du TP1 (id, name, email, password, createdAt).
- `20261105100000_add_user_role` : ajout de `role String @default("ETUDIANT")`.

## Matrice des permissions (décisions documentées)

| Action | ADMIN | ENSEIGNANT | ETUDIANT |
|---|---|---|---|
| Lister les étudiants | Oui (tous) | Oui (tous) | Ses données uniquement |
| Créer un étudiant | Oui | Non (403) | Non (403) |
| Modifier un étudiant | Oui (name, email, password) | **Selon règle : `name` uniquement** | Non (403) |
| Supprimer un étudiant | Oui | Non (403) | Non (403) |
| Consulter son profil | Oui | Oui | Oui |

**Règle de l'enseignant** : comme il n'existe que la table `User`, les « informations pédagogiques »
modifiables sont limitées au `name` d'un étudiant. Il ne peut modifier ni l'email, ni le mot de passe (403), ni le rôle
(rejeté par Zod, 400), ni un autre enseignant/admin (404).

**Politique IDOR** : un étudiant qui demande le dossier d'un autre reçoit **404** (on ne révèle pas l'existence de la ressource).

## Architecture

Flux : `session → rôle/permission → validation → opération en base`.

```
prisma/              schema.prisma, migrations/, seed.ts
src/middleware.ts    /dashboard protégé ; /login et /register interdits si connecté (jose, Edge)
src/lib/prisma.ts    client Prisma unique
src/lib/jwt.ts       signToken / verifyToken (HS256, 7 jours) — compatible Edge
src/lib/session.ts   createSession / getSession / destroySession (cookie httpOnly)
src/lib/authorization.ts   requireRole(rolesAutorises) -> 401 / 403, rôle relu en base
src/lib/validation.ts      schémas Zod
src/lib/roles.ts     ROLES, isRole, matrice PERMISSIONS (affichage UI)
src/app/api/auth/*   register, login, logout, me
src/app/api/students/route.ts        GET, POST
src/app/api/students/[id]/route.ts   GET, PATCH, DELETE
src/components/      AuthForm, LogoutButton, StudentsManager
```

## Règles de sécurité appliquées

- `requireRole` lit la session JWT, **relit le rôle en base** via `userId` et ne fait jamais confiance au navigateur
  (ni body, ni cookie lisible) : 401 sans session valide, 403 si rôle insuffisant ou invalide.
- Le rôle n'est jamais accepté depuis le client : `register` l'ignore (défaut `ETUDIANT`), `PATCH` utilise `.strict()` (champ `role` → 400).
- Contrôle rôle **et** propriété de la ressource (prévention IDOR).
- Entrées validées avec Zod ; `password` jamais sélectionné ni renvoyé (`publicUserSelect`).
- Mot de passe haché avec bcrypt ; message générique « Identifiants invalides » au login.

## Tests de sécurité

Avec le serveur lancé et la base seedée : `./tests.sh` (curl). Résultats attendus :

| Test | Code |
|---|---|
| Sans session, API privée | 401 |
| ETUDIANT : DELETE | 403 |
| ENSEIGNANT : POST | 403 |
| Étudiant A → profil de B | 404 |
| ADMIN : opérations valides | 2xx |
| Aucune réponse ne contient `password` | ✔ |

Exemple manuel :

```bash
curl -i -c admin.jar -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Password123"}' http://localhost:3000/api/auth/login
curl -i -b admin.jar http://localhost:3000/api/students
curl -i http://localhost:3000/api/students          # 401
```

## Questions de réflexion (TP2)

1. **Authentification vs autorisation** : l'authentification établit *qui* est l'utilisateur ; l'autorisation décide *ce qu'il a le droit de faire*.
2. **401 vs 403** : 401 = non authentifié (pas de session valide) ; 403 = authentifié mais accès interdit (rôle insuffisant).
3. **Masquer un bouton ne suffit pas** : l'API est appelable directement (curl, Postman) ; seul le serveur peut faire respecter les droits.
4. **IDOR** (Insecure Direct Object Reference) : accéder à la ressource d'autrui en changeant simplement un identifiant (`/api/students/4`) faute de contrôle de propriété.
5. **Pourquoi ne pas accepter le rôle du client** : tout ce qui vient du navigateur est modifiable ; le serveur doit lire le rôle depuis une source fiable (la base).

## Questions du TP1 (rappel de réponses)

- `@unique` sur email : garantit un compte par email et permet la recherche à la connexion ; sans lui, doublons possibles.
- `prisma/migrations` : historique SQL reproductible du schéma ; à versionner pour recréer la base à l'identique.
- Limite SQLite : fichier local, un seul écrivain à la fois, pas adapté à plusieurs serveurs → PostgreSQL en production.
- `httpOnly` : cookie illisible par JavaScript (anti-XSS) ; `secure` : HTTPS uniquement ; `sameSite=lax` : limite le CSRF.
- Pas de mot de passe dans le JWT : le payload est seulement encodé (lisible), pas chiffré.
- Si `JWT_SECRET` change : toutes les sessions existantes deviennent invalides (déconnexion générale).
- Message générique : évite de révéler si un email existe (énumération de comptes).
- `bcrypt.hash(pwd, 10)` : 10 = coût (2^10 tours) ; l'augmenter ralentit le hachage et donc les attaques par force brute.
- Codes : 201 créé, 400 données invalides, 401 non authentifié/identifiants faux, 404 introuvable, 409 conflit (email déjà pris).
- Middleware : Edge Runtime, Prisma n'y est pas compatible → jose seul. Défense en profondeur : le middleware n'est qu'une première barrière, `/dashboard` et les API revérifient côté serveur.
