import { z } from "zod";

const name = z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères");
const email = z.string().trim().toLowerCase().email("Format d'email invalide");
const newPassword = z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères");

export const registerSchema = z.object({ name, email, password: newPassword });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Le mot de passe est obligatoire"),
});

// Création d'un étudiant (ADMIN). Le rôle n'est JAMAIS lu depuis le client.
export const createStudentSchema = registerSchema;

// Modification : .strict() rejette tout champ inconnu (ex. "role" => 400).
export const updateStudentSchema = z
  .object({
    name: name.optional(),
    email: email.optional(),
    password: newPassword.optional(),
  })
  .strict()
  .refine((d) => Object.keys(d).length > 0, { message: "Aucun champ à modifier" });

export function formatZodError(error: z.ZodError) {
  return {
    error: "Données invalides",
    details: error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
  };
}
