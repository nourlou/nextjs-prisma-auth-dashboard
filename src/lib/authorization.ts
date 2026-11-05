import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { isRole, type Role } from "@/lib/roles";

// Ne jamais sélectionner / renvoyer le champ password.
export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
};

export type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; status: 401 | 403 };

/**
 * 1. Lit la session JWT (cookie httpOnly)      -> sinon 401
 * 2. Relit l'utilisateur et son rôle en base   -> absent : 401
 * 3. Vérifie que le rôle est valide et autorisé -> sinon 403
 * Le rôle ne vient jamais du navigateur (ni du body, ni du JWT).
 */
export async function requireRole(allowed: Role[]): Promise<AuthResult> {
  const session = await getSession();
  if (!session) return { ok: false, status: 401 };

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: publicUserSelect,
  });
  if (!user) return { ok: false, status: 401 };

  if (!isRole(user.role) || !allowed.includes(user.role)) {
    return { ok: false, status: 403 };
  }
  return { ok: true, user: { ...user, role: user.role } };
}
