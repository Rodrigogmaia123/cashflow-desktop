-- Script SQL direto para corrigir problemas de foreign key
-- Execute este script diretamente no banco de dados se o script TypeScript não funcionar

-- 1. Remover UserWorkspace com userId inválido
DELETE FROM "UserWorkspace"
WHERE "userId" NOT IN (SELECT id FROM "User");

-- 2. Remover UserWorkspace com workspaceId inválido
DELETE FROM "UserWorkspace"
WHERE "workspaceId" NOT IN (SELECT id FROM "Workspace");

-- 3. Corrigir activeWorkspaceId inválidos
UPDATE "User"
SET "activeWorkspaceId" = NULL
WHERE "activeWorkspaceId" IS NOT NULL
  AND "activeWorkspaceId" NOT IN (SELECT id FROM "Workspace");

-- 4. Corrigir activeWorkspaceId para usuários sem acesso ao workspace
UPDATE "User" u
SET "activeWorkspaceId" = (
  SELECT uw."workspaceId"
  FROM "UserWorkspace" uw
  WHERE uw."userId" = u.id
  LIMIT 1
)
WHERE u."activeWorkspaceId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "UserWorkspace" uw
    WHERE uw."userId" = u.id
      AND uw."workspaceId" = u."activeWorkspaceId"
  );

-- 5. Definir activeWorkspaceId como NULL se não houver workspace disponível
UPDATE "User" u
SET "activeWorkspaceId" = NULL
WHERE u."activeWorkspaceId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "UserWorkspace" uw
    WHERE uw."userId" = u.id
      AND uw."workspaceId" = u."activeWorkspaceId"
  )
  AND NOT EXISTS (
    SELECT 1
    FROM "UserWorkspace" uw
    WHERE uw."userId" = u.id
  );

