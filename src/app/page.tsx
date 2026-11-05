import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-3xl font-bold text-slate-900">Gestion des étudiants</h1>
      <p className="text-slate-600">Authentification et contrôle d&apos;accès par rôle.</p>
      <div className="flex gap-3">
        <Link href="/login" className="rounded bg-slate-900 px-4 py-2 text-white">
          Se connecter
        </Link>
        <Link href="/register" className="rounded border border-slate-900 px-4 py-2">
          S&apos;inscrire
        </Link>
      </div>
    </main>
  );
}
