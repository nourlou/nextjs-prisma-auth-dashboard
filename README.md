# Next.js Prisma Dashboard

Next.js 
Suite du TP1 (authentification). **Une seule table : `User`.** Un « étudiant » est un `User` dont `role = "ETUDIANT"`.

## Installation

```bash
npm install                 # installe et génère le client Prisma
npx prisma migrate dev      # applique les migrations (init + add_user_role) -> prisma/dev.db
npm run dev                 # http://localhost:3000
npx prisma studio           # explorer la table User
```

Le fichier `.env` fourni contient un `JWT_SECRET` de développement. Il est exclu de Git (`.gitignore`) ;
copiez `.env.example` et générez votre propre secret : `openssl rand -base64 48`.


## Matrice des permissions (décisions documentées)

| Action | ADMIN | ENSEIGNANT | ETUDIANT |
|---|---|---|---|
| Lister les étudiants | Oui  | Oui  | Ses données uniquement |
| Créer un étudiant | Oui | Non  | Non  |
| Modifier un étudiant | Oui  | **Selon règle** | Non  |
| Supprimer un étudiant | Oui | Non  | Non  |
| Consulter son profil | Oui | Oui | Oui |

