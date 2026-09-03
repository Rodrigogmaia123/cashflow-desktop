"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { requireActiveWorkspaceId } from "@/lib/workspace";
import { requireWorkspacePermission } from "@/lib/rbac/workspace-permissions";
import { trackEvent } from "@/lib/analytics/events";

/**
 * Server Action para trackear visualização da feature API
 */
export async function trackApiFeatureViewed(workspaceId?: string) {
  await trackEvent("api_feature_viewed", {
    plan: "business",
    workspaceId,
    metadata: {
      status: "coming_soon",
    },
  });
}

const createApiKeySchema = z.object({
  name: z.string().min(1).max(120),
});

const revokeApiKeySchema = z.object({
  id: z.string().cuid(),
});

/**
 * Gera uma API key segura
 */
function generateApiKey(): string {
  // Gera 32 bytes aleatórios e converte para base64
  const randomBytes = crypto.randomBytes(32);
  const key = randomBytes.toString("base64url");
  // Prefixo para identificar como API key do Cashflow Pro
  return `cfp_${key}`;
}

/**
 * Cria uma nova API key
 */
export async function createApiKeyAction(formData: FormData) {
  try {
    const workspaceId = await requireActiveWorkspaceId();
    
    // Verifica permissão de criar
    await requireWorkspacePermission(workspaceId, "create");

    const parsed = createApiKeySchema.safeParse({
      name: formData.get("name"),
    });

    if (!parsed.success) {
      throw new Error("Nome inválido. Deve ter entre 1 e 120 caracteres.");
    }

    // Gera a API key
    const apiKey = generateApiKey();
    
    // Faz hash da key para armazenar no banco
    const hashedKey = await hashPassword(apiKey);
    
    // Prefixo para exibição (primeiros 8 caracteres)
    const keyPrefix = apiKey.substring(0, 12); // "cfp_" + 8 caracteres

    // Salva no banco
    const saved = await prisma.apiKey.create({
      data: {
        workspaceId,
        name: parsed.data.name,
        key: hashedKey,
        keyPrefix,
      },
    });

    // Track event
    await trackEvent("api_key_created", {
      workspaceId,
      feature: "api_access",
    });

    revalidatePath("/app/settings/api");

    return {
      success: true,
      id: saved.id,
      key: apiKey, // Retorna a key completa apenas uma vez
    };
  } catch (error) {
    console.error("Erro ao criar API key:", error);
    throw error instanceof Error ? error : new Error("Erro ao criar API key");
  }
}

/**
 * Revoga uma API key
 */
export async function revokeApiKeyAction(formData: FormData) {
  try {
    const workspaceId = await requireActiveWorkspaceId();
    
    // Verifica permissão de deletar
    await requireWorkspacePermission(workspaceId, "delete");

    const parsed = revokeApiKeySchema.safeParse({
      id: formData.get("id"),
    });

    if (!parsed.success) {
      throw new Error("ID inválido.");
    }

    // Verifica se a key pertence ao workspace
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: parsed.data.id,
        workspaceId,
      },
    });

    if (!apiKey) {
      throw new Error("API key não encontrada ou não pertence ao workspace.");
    }

    // Deleta a key
    await prisma.apiKey.delete({
      where: {
        id: parsed.data.id,
      },
    });

    // Track event
    await trackEvent("api_key_revoked", {
      workspaceId,
      feature: "api_access",
    });

    revalidatePath("/app/settings/api");

    return { success: true };
  } catch (error) {
    console.error("Erro ao revogar API key:", error);
    throw error instanceof Error ? error : new Error("Erro ao revogar API key");
  }
}
