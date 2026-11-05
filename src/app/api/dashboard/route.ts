import { NextResponse } from "next/server";
import { requireRole } from "@/lib/authorization";
import { getDashboardStats } from "@/lib/dashboard";

export async function GET() {
  const auth = await requireRole(["ADMIN"]);

  if (!auth.ok) {
    return NextResponse.json(
      { error: "Accès interdit" },
      { status: auth.status }
    );
  }

  try {
    const stats = await getDashboardStats();
    return NextResponse.json(stats);
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}