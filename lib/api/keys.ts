/**
 * Sistema de API Keys (BUSINESS ONLY)
 * 
 * Gerencia criação, validação e revogação de API keys por workspace.
 */

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { checkFeatureAccess } from "@/lib/plans/authorization";
import { randomBytes, createHash } from "crypto";

const API_KEY_PREFIX = "cfp_live_";
const API_KEY_LENGTH = 32; // 32 bytes = 64 caracteres hex

/**
 * Gera uma nova API key
 */
function generateApiKey(): { key: string; keyHash: string; keyPrefix: string } {
  const rawKey = randomBytes(API_KEY_LENGTH).toString("hex");
  const fullKey = `${API_KEY_PREFIX}${rawKey}`;
  const keyHash = createHash("sha256").update(fullKey).digest("hex");
  const keyPrefix = fullKey.substring(0, 20); // "cfp_live_12345678"

  return {
    key: fullKey,
    keyHash,
    keyPrefix,
  };
}

/**
 * Cria uma nova API key para o workspace
 */
export async function createApiKey(workspaceId: string, name: string): Promise<{ key: string; id: string }> {
  // Verifica se o usuário tem acesso à feature
  const featureCheck = await checkFeatureAccess("api_access");
  if (!featureCheck.allowed) {
    throw new Error(featureCheck.reason || "Acesso à API disponível apenas no plano BUSINESS");
  }

  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  // Verifica se o usuário tem permissão no workspace
  const membership = await prisma.userWorkspace.findUnique({
    where: {
      userId_workspaceId: {
        userId: user.id,
        workspaceId,
      },
    },
  });

  if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
    throw new Error("Apenas OWNER ou ADMIN podem criar API keys");
  }

  const { key, keyHash, keyPrefix } = generateApiKey();

  const apiKey = await prisma.apiKey.create({
    data: {
      workspaceId,
      name,
      key: keyHash,
      keyPrefix,
    },
  });

  // Retorna a chave completa apenas uma vez (não é salva no DB)
  return {
    key,
    id: apiKey.id,
  };
}

/**
 * Lista todas as API keys do workspace
 */
export async function listApiKeys(workspaceId: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  // Verifica se o usuário tem acesso ao workspace
  const membership = await prisma.userWorkspace.findUnique({
    where: {
      userId_workspaceId: {
        userId: user.id,
        workspaceId,
      },
    },
  });

  if (!membership) {
    throw new Error("Acesso negado ao workspace");
  }

  return prisma.apiKey.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      lastUsedAt: true,
      createdAt: true,
      expiresAt: true,
    },
  });
}

/**
 * Revoga uma API key
 */
export async function revokeApiKey(workspaceId: string, apiKeyId: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  // Verifica permissão
  const membership = await prisma.userWorkspace.findUnique({
    where: {
      userId_workspaceId: {
        userId: user.id,
        workspaceId,
      },
    },
  });

  if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
    throw new Error("Apenas OWNER ou ADMIN podem revogar API keys");
  }

  await prisma.apiKey.delete({
    where: {
      id: apiKeyId,
      workspaceId, // Garante que a key pertence ao workspace
    },
  });
}

/**
 * Valida uma API key e retorna o workspaceId
 * Usado em rotas de API
 */
export async function validateApiKey(apiKey: string): Promise<{ workspaceId: string } | null> {
  const keyHash = createHash("sha256").update(apiKey).digest("hex");

  const apiKeyRecord = await prisma.apiKey.findFirst({
    where: {
      key: keyHash,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
  });

  if (!apiKeyRecord) {
    return null;
  }

  // Atualiza lastUsedAt
  await prisma.apiKey.update({
    where: { id: apiKeyRecord.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    workspaceId: apiKeyRecord.workspaceId,
  };
}

