"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        const details = (json.details as { message: string }[] | undefined)?.map((d) => d.message);
        setError(details?.join(" · ") || json.error || "Erreur");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  const input = "w-full rounded border border-slate-300 px-3 py-2";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "register" && <input name="name" placeholder="Nom" className={input} required />}
      <input name="email" type="email" placeholder="Email" className={input} required />
      <input name="password" type="password" placeholder="Mot de passe" className={input} required />
      {error && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-slate-900 py-2 text-white disabled:opacity-50"
      >
        {loading ? "Chargement…" : mode === "login" ? "Se connecter" : "S'inscrire"}
      </button>
    </form>
  );
}
