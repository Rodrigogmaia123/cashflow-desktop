-- Migration manual para adicionar onboardingCompleted
-- Execute este SQL diretamente no banco se a migration não aplicar

-- SQLite não suporta ALTER TABLE ADD COLUMN com DEFAULT diretamente
-- Então precisamos recriar a tabela

PRAGMA foreign_keys=OFF;

-- Criar nova tabela com a coluna
CREATE TABLE "User_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailVerified" DATETIME,
    "image" TEXT,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT 0,
    "activeWorkspaceId" TEXT,
    CONSTRAINT "User_activeWorkspaceId_fkey" FOREIGN KEY ("activeWorkspaceId") REFERENCES "Workspace" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Copiar dados existentes
INSERT INTO "User_new" ("id", "name", "email", "createdAt", "emailVerified", "image", "activeWorkspaceId")
SELECT "id", "name", "email", "createdAt", "emailVerified", "image", "activeWorkspaceId" FROM "User";

-- Remover tabela antiga
DROP TABLE "User";

-- Renomear nova tabela
ALTER TABLE "User_new" RENAME TO "User";

-- Recriar índice
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

PRAGMA foreign_keys=ON;
