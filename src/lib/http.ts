import { NextResponse } from "next/server";
import type { AuthResult } from "@/lib/authorization";

export function authError(auth: Extract<AuthResult, { ok: false }>) {
  return NextResponse.json(
    { error: auth.status === 401 ? "Non authentifié" : "Accès interdit" },
    { status: auth.status }
  );
}

export function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function isUniqueError(e: unknown) {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
}
