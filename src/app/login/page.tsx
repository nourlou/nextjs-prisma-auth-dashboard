import Link from "next/link";
import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">Connexion</h1>
      <AuthForm mode="login" />
      <p className="text-sm text-slate-600">
        Pas de compte ? <Link href="/register" className="underline">S&apos;inscrire</Link>
      </p>
    </main>
  );
}
