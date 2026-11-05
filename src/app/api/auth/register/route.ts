import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { registerSchema, formatZodError } from "@/lib/validation";
import { isUniqueError } from "@/lib/http";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(formatZodError(parsed.error), { status: 400 });
  }
  const { name, email, password } = parsed.data;

  try {
    // Le rôle n'est pas lu depuis le body : la valeur par défaut est ETUDIANT.
    const user = await prisma.user.create({
      data: { name, email, password: await bcrypt.hash(password, 10) },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    await createSession(user.id);
    return NextResponse.json({ user }, { status: 201 });
  } catch (e) {
    if (isUniqueError(e)) {
      return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });
    }
    throw e;
  }
}
