"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PERMISSIONS, type Role } from "@/lib/roles";

type Student = { id: number; name: string; email: string; createdAt: string };

export default function StudentsManager({ role }: { role: Role }) {
  const router = useRouter();
  const perm = PERMISSIONS[role];
  const [students, setStudents] = useState<Student[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [editing, setEditing] = useState<Student | null>(null);

  // Appel API avec gestion claire des erreurs 401 / 403.
  const call = useCallback(
    async (url: string, init?: RequestInit) => {
      setError(null);
      setInfo(null);
      const res = await fetch(url, {
        ...init,
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setError("401 – Session expirée ou non authentifié.");
        router.push("/login");
        return null;
      }
      if (res.status === 403) {
        setError("403 – Accès interdit : vous n'avez pas les droits pour cette action.");
        return null;
      }
      if (!res.ok) {
        const details = (json.details as { message: string }[] | undefined)?.map((d) => d.message);
        setError(`${res.status} – ${details?.join(" · ") || json.error || "Erreur"}`);
        return null;
      }
      return json;
    },
    [router]
  );

  const load = useCallback(async () => {
    const json = await call("/api/students");
    if (json) setStudents(json.students);
  }, [call]);

  useEffect(() => {
    load();
  }, [load]);

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = JSON.stringify(Object.fromEntries(new FormData(form)));
    const json = await call("/api/students", { method: "POST", body });
    if (json) {
      form.reset();
      setInfo("Étudiant créé.");
      load();
    }
  }

  async function onUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    // L'enseignant n'envoie que le nom ; l'admin n'envoie le mot de passe que s'il est rempli.
    if (!data.password) delete data.password;
    const json = await call(`/api/students/${editing.id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    if (json) {
      setEditing(null);
      setInfo("Étudiant modifié.");
      load();
    }
  }

  async function onDelete(s: Student) {
    if (!confirm(`Supprimer ${s.name} ?`)) return;
    const json = await call(`/api/students/${s.id}`, { method: "DELETE" });
    if (json) {
      setInfo("Étudiant supprimé.");
      load();
    }
  }

  const input = "rounded border border-slate-300 px-2 py-1 text-sm";

  return (
    <section className="space-y-4 rounded bg-white p-4 shadow">
      <h2 className="font-semibold">
        {perm.list === "self" ? "Mes informations" : "Liste des étudiants"}
      </h2>

      {error && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
      {info && <p className="rounded bg-green-50 p-2 text-sm text-green-700">{info}</p>}

      {perm.create && (
        <form onSubmit={onCreate} className="flex flex-wrap gap-2">
          <input name="name" placeholder="Nom" className={input} required />
          <input name="email" type="email" placeholder="Email" className={input} required />
          <input name="password" type="password" placeholder="Mot de passe" className={input} required />
          <button className="rounded bg-slate-900 px-3 py-1 text-sm text-white">Créer</button>
        </form>
      )}

      {editing && (
        <form onSubmit={onUpdate} className="flex flex-wrap gap-2 rounded bg-slate-100 p-2">
          <input name="name" defaultValue={editing.name} className={input} required />
          {perm.update === "all" && (
            <>
              <input name="email" type="email" defaultValue={editing.email} className={input} required />
              <input name="password" type="password" placeholder="Nouveau mot de passe (optionnel)" className={input} />
            </>
          )}
          <button className="rounded bg-slate-900 px-3 py-1 text-sm text-white">Enregistrer</button>
          <button type="button" onClick={() => setEditing(null)} className="text-sm underline">
            Annuler
          </button>
        </form>
      )}

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b text-slate-500">
            <th className="py-1">ID</th>
            <th>Nom</th>
            <th>Email</th>
            <th>Inscrit le</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id} className="border-b">
              <td className="py-1">{s.id}</td>
              <td>{s.name}</td>
              <td>{s.email}</td>
              <td>{new Date(s.createdAt).toLocaleDateString("fr-FR")}</td>
              <td className="space-x-2 text-right">
                {perm.update && (
                  <button onClick={() => setEditing(s)} className="underline">Modifier</button>
                )}
                {perm.delete && (
                  <button onClick={() => onDelete(s)} className="text-red-700 underline">
                    Supprimer
                  </button>
                )}
              </td>
            </tr>
          ))}
          {students.length === 0 && (
            <tr><td colSpan={5} className="py-3 text-slate-500">Aucun étudiant.</td></tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
