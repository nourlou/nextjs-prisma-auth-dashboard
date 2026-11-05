import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole, publicUserSelect } from "@/lib/authorization";
import { authError, isUniqueError, parseId } from "@/lib/http";
import { updateStudentSchema, formatZodError } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

const notFound = () => NextResponse.json({ error: "Étudiant introuvable" }, { status: 404 });
const badId = () => NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });

// GET : ADMIN / ENSEIGNANT => n'importe quel étudiant.
//       ETUDIANT => uniquement son propre dossier.
// Politique IDOR : le dossier d'un autre étudiant renvoie 404 (on ne révèle pas son existence).
export async function GET(_req: Request, { params }: Ctx) {
  const auth = await requireRole(["ADMIN", "ENSEIGNANT", "ETUDIANT"]);
  if (!auth.ok) return authError(auth);

  const id = parseId((await params).id);
  if (!id) return badId();

  if (auth.user.role === "ETUDIANT" && auth.user.id !== id) return notFound();

  const student = await prisma.user.findFirst({
    where: { id, role: "ETUDIANT" },
    select: publicUserSelect,
  });
  if (!student) return notFound();
  return NextResponse.json({ student });
}

// PATCH : ADMIN => name, email, password ; ENSEIGNANT => name uniquement.
// ETUDIANT => 403.
export async function PATCH(req: Request, { params }: Ctx) {
  const auth = await requireRole(["ADMIN", "ENSEIGNANT"]);
  if (!auth.ok) return authError(auth);

  const id = parseId((await params).id);
  if (!id) return badId();

  const body = await req.json().catch(() => null);
  const parsed = updateStudentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(formatZodError(parsed.error), { status: 400 });
  }
  const { name, email, password } = parsed.data;

  // Règle ENSEIGNANT : seules les informations pédagogiques (name) sont modifiables.
  if (auth.user.role === "ENSEIGNANT" && (email !== undefined || password !== undefined)) {
    return NextResponse.json(
      { error: "Accès interdit : un enseignant ne peut modifier que le nom" },
      { status: 403 }
    );
  }

  const target = await prisma.user.findFirst({ where: { id, role: "ETUDIANT" } });
  if (!target) return notFound();

  try {
    const student = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(password !== undefined && { password: await bcrypt.hash(password, 10) }),
      },
      select: publicUserSelect,
    });
    return NextResponse.json({ student });
  } catch (e) {
    if (isUniqueError(e)) {
      return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });
    }
    throw e;
  }
}

// DELETE : ADMIN uniquement.
export async function DELETE(_req: Request, { params }: Ctx) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.ok) return authError(auth);

  const id = parseId((await params).id);
  if (!id) return badId();

  const target = await prisma.user.findFirst({ where: { id, role: "ETUDIANT" } });
  if (!target) return notFound();

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ message: "Étudiant supprimé" });
}
