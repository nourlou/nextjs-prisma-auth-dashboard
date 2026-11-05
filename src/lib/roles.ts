export const ROLES = ["ADMIN", "ENSEIGNANT", "ETUDIANT"] as const;
export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

// Matrice des permissions (TP2 - Partie 2).
// Utilisée par l'interface pour AFFICHER les actions ; la sécurité réelle
// est appliquée côté serveur dans les Route Handlers (requireRole).
export const PERMISSIONS = {
  ADMIN: { list: "all", create: true, update: "all", delete: true },
  ENSEIGNANT: { list: "all", create: false, update: "name", delete: false },
  ETUDIANT: { list: "self", create: false, update: false, delete: false },
} as const;
