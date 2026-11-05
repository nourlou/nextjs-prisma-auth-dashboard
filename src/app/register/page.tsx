import Link from "next/link";
import AuthForm from "@/components/AuthForm";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">Inscription</h1>
      <AuthForm mode="register" />
      <p className="text-sm text-slate-600">
        Déjà inscrit ? <Link href="/login" className="underline">Se connecter</Link>
      </p>
    </main>
  );
}
