import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { publicUserSelect } from "@/lib/authorization";
import { isRole } from "@/lib/roles";
import { getDashboardStats } from "@/lib/dashboard";
import LogoutButton from "@/components/LogoutButton";
import StudentsManager from "@/components/StudentsManager";

const ACTIONS: Record<string, string[]> = {
  ADMIN: [
    "Créer un étudiant",
    "Consulter la liste",
    "Modifier un étudiant",
    "Supprimer un étudiant",
  ],
  ENSEIGNANT: [
    "Consulter la liste",
    "Modifier le nom d'un étudiant",
  ],
  ETUDIANT: [
    "Consulter uniquement mes informations",
  ],
};

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: publicUserSelect,
  });

  if (!user || !isRole(user.role)) redirect("/login");

  // Les statistiques globales sont réservées à l'ADMIN.
  const stats =
    user.role === "ADMIN" ? await getDashboardStats() : null;

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <LogoutButton />
      </header>

      <section className="rounded bg-white p-4 shadow">
        <h2 className="mb-3 font-semibold">Mon profil</h2>
        <p>Nom : {user.name}</p>
        <p>Email : {user.email}</p>
        <p>Rôle : {user.role}</p>
        <p>
          Inscrit le : {user.createdAt.toLocaleDateString("fr-FR")}
        </p>
      </section>

      {stats && (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-blue-50 p-5 shadow">
              <p className="text-sm text-slate-600">
                Total des étudiants
              </p>
              <p className="text-3xl font-bold">
                {stats.totalStudents}
              </p>
            </div>

            <div className="rounded-lg bg-green-50 p-5 shadow">
              <p className="text-sm text-slate-600">
                Nouveaux étudiants (30 jours)
              </p>
              <p className="text-3xl font-bold">
                {stats.recentStudents}
              </p>
            </div>
          </section>

          <section className="rounded-lg bg-white p-5 shadow">
            <h2 className="mb-4 font-semibold">
              Les 5 derniers étudiants inscrits
            </h2>

            {stats.latestStudents.length === 0 ? (
              <p>Aucun étudiant trouvé.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2">Nom</th>
                      <th className="p-2">Email</th>
                      <th className="p-2">Date d'inscription</th>
                    </tr>
                  </thead>

                  <tbody>
                    {stats.latestStudents.map((student) => (
                      <tr key={student.id} className="border-b">
                        <td className="p-2">{student.name}</td>
                        <td className="p-2">{student.email}</td>
                        <td className="p-2">
                          {student.createdAt.toLocaleDateString("fr-FR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      <section className="rounded bg-white p-4 shadow">
        <h2 className="mb-2 font-semibold">Actions disponibles</h2>
        <ul className="list-inside list-disc text-sm text-slate-700">
          {ACTIONS[user.role].map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
      </section>

      <StudentsManager role={user.role} />
    </main>
  );
}