#!/usr/bin/env bash
# Tests de sécurité TP2 - Partie 6 (serveur lancé : npm run dev, base seedée : npm run db:seed)
B=http://localhost:3000
J='Content-Type: application/json'
code() { curl -s -o /dev/null -w "%{http_code}" "$@"; }
check() { printf "%-62s attendu %s -> %s\n" "$1" "$2" "$3"; }

login() { curl -s -c "/tmp/$1.jar" -H "$J" -d "{\"email\":\"$2\",\"password\":\"Password123\"}" $B/api/auth/login >/dev/null; }
login admin admin@test.com
login prof enseignant@test.com
login etu1 etudiant1@test.com

check "Sans session : GET /api/students" 401 "$(code $B/api/students)"
check "ETUDIANT : DELETE /api/students/3" 403 "$(code -X DELETE -b /tmp/etu1.jar $B/api/students/3)"
check "ENSEIGNANT : POST /api/students" 403 "$(code -X POST -b /tmp/prof.jar -H "$J" -d '{"name":"X Y","email":"x@y.com","password":"Password123"}' $B/api/students)"
check "ETUDIANT 1 : GET profil d'un autre étudiant (id 4)" 404 "$(code -b /tmp/etu1.jar $B/api/students/4)"
check "ETUDIANT 1 : GET son propre profil (id 3)" 200 "$(code -b /tmp/etu1.jar $B/api/students/3)"
check "ETUDIANT : PATCH son propre dossier" 403 "$(code -X PATCH -b /tmp/etu1.jar -H "$J" -d '{"name":"Hack"}' $B/api/students/3)"
check "ENSEIGNANT : PATCH name d'un étudiant" 200 "$(code -X PATCH -b /tmp/prof.jar -H "$J" -d '{"name":"Etudiant Un (note)"}' $B/api/students/3)"
check "ENSEIGNANT : PATCH email d'un étudiant" 403 "$(code -X PATCH -b /tmp/prof.jar -H "$J" -d '{"email":"z@z.com"}' $B/api/students/3)"
check "ADMIN : PATCH avec champ role (rejeté par Zod)" 400 "$(code -X PATCH -b /tmp/admin.jar -H "$J" -d '{"role":"ADMIN"}' $B/api/students/3)"
check "ADMIN : POST /api/students (données valides)" 201 "$(code -X POST -b /tmp/admin.jar -H "$J" -d '{"name":"Nouveau Etu","email":"nouveau@test.com","password":"Password123"}' $B/api/students)"
check "ADMIN : POST avec données invalides" 400 "$(code -X POST -b /tmp/admin.jar -H "$J" -d '{"name":"A","email":"nope","password":"1"}' $B/api/students)"
check "Inscription avec role=ADMIN dans le body (ignoré => ETUDIANT)" 201 "$(code -X POST -H "$J" -d '{"name":"Pirate","email":"pirate@test.com","password":"Password123","role":"ADMIN"}' $B/api/auth/register)"

echo; echo "Le champ password ne doit apparaître nulle part :"
curl -s -b /tmp/admin.jar $B/api/students | grep -c password || true
