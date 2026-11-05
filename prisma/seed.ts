import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Uniquement la table User : les trois rôles sont des utilisateurs.
const users = [
  { name: "Admin", email: "admin@test.com", role: "ADMIN" },
  { name: "Prof Meddeb", email: "enseignant@test.com", role: "ENSEIGNANT" },
  { name: "Etudiant Un", email: "etudiant1@test.com", role: "ETUDIANT" },
  { name: "Etudiant Deux", email: "etudiant2@test.com", role: "ETUDIANT" },
  { name: "Etudiant Trois", email: "etudiant3@test.com", role: "ETUDIANT" },
];

async function main() {
  const password = await bcrypt.hash("Password123", 10);
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role },
      create: { ...u, password },
    });
  }
  console.log(`${users.length} utilisateurs prêts (mot de passe : Password123)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
