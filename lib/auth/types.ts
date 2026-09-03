import type { Plan } from "@/lib/billing/plans";

export type AuthProvider = "nextauth" | "clerk";

export type AuthUser = {
  id: string;
  name: string | null;
  email: string;
  accountType: "PF" | "PJ" | null;
  plan: Plan; // Usa tipo canônico de planos
  isLifetime: boolean;
  isAdmin: boolean;
  // Workspace selecionado (multi-tenant)
  activeWorkspaceId: string | null;
  onboardingCompleted: boolean;
  image: string | null; // URL da imagem do perfil
};


