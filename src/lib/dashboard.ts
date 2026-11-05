
import { prisma } from "@/lib/prisma";

// Statistiques générales des étudiants
export async function getDashboardStats() {
  // Date des 30 derniers jours
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);

  // Requêtes Prisma
  const [
    totalStudents,
    recentStudents,
    latestStudents,
  ] = await Promise.all([

    // KPI 1 : Total des étudiants
    prisma.user.count({
      where: {
        role: "ETUDIANT",
      },
    }),

    // KPI 2 : Étudiants inscrits durant les 30 derniers jours
    prisma.user.count({
      where: {
        role: "ETUDIANT",
        createdAt: {
          gte: last30Days,
        },
      },
    }),

    // Tableau : 5 derniers étudiants
    prisma.user.findMany({
      where: {
        role: "ETUDIANT",
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),
  ]);

  return {
    totalStudents,
    recentStudents,
    latestStudents,
  };
}
