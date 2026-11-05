import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole, publicUserSelect } from "@/lib/authorization";
import { authError, isUniqueError } from "@/lib/http";
import { createStudentSchema, formatZodError } from "@/lib/validation";

// Un « étudiant » = une ligne de la table User avec role = "ETUDIANT".

// GET : ADMIN et ENSEIGNANT => tous les étudiants ; ETUDIANT => ses données.
export async function GET() {
  const auth = await requireRole(["ADMIN", "ENSEIGNANT", "ETUDIANT"]);
  if (!auth.ok) return authError(auth);

  const where =
    auth.user.role === "ETUDIANT"
      ? { id: auth.user.id, role: "ETUDIANT" }
      : { role: "ETUDIANT" };

  const students = await prisma.user.findMany({
    where,
    select: publicUserSelect,
    orderBy: { id: "asc" },
  });
  return NextResponse.json({ students });
}

// POST : ADMIN uniquement.
export async function POST(req: Request) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.ok) return authError(auth);

  const body = await req.json().catch(() => null);
  const parsed = createStudentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(formatZodError(parsed.error), { status: 400 });
  }
  const { name, email, password } = parsed.data;

  try {
    const student = await prisma.user.create({
      data: { name, email, password: await bcrypt.hash(password, 10), role: "ETUDIANT" },
      select: publicUserSelect,
    });
    return NextResponse.json({ student }, { status: 201 });
  } catch (e) {
    if (isUniqueError(e)) {
      return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });
    }
    throw e;
  }
}
