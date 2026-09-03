import { execSync } from "child_process";
import { prisma } from "@/lib/db";

/**
 * Script completo para resolver problemas do Prisma
 * Executa todos os passos necessários em sequência
 */
async function main() {
  console.log("🔧 Iniciando correção completa de problemas do Prisma...\n");

  try {
    // Passo 1: Regenerar Prisma Client
    console.log("📦 Passo 1: Regenerando Prisma Client...");
    try {
      execSync("npx prisma generate", { stdio: "inherit" });
      console.log("   ✅ Prisma Client regenerado com sucesso.\n");
    } catch (error) {
      console.error("   ❌ Erro ao regenerar Prisma Client:", error);
      throw error;
    }

    // Passo 2: Verificar conexão
    console.log("🔌 Passo 2: Verificando conexão com o banco...");
    try {
      await prisma.$connect();
      console.log("   ✅ Conexão estabelecida.\n");
    } catch (error) {
      console.error("   ❌ Erro de conexão:", error);
      throw error;
    }

    // Passo 3: Verificar status das migrations
    console.log("📋 Passo 3: Verificando migrations...");
    try {
      const result = execSync("npx prisma migrate status", { encoding: "utf-8" });
      console.log(result);
      if (result.includes("Database schema is up to date")) {
        console.log("   ✅ Migrations estão atualizadas.\n");
      } else {
        console.log("   ⚠️  Há migrations pendentes. Execute: npx prisma migrate deploy\n");
      }
    } catch (error: any) {
      console.log("   ⚠️  Não foi possível verificar migrations:", error.message);
    }

    // Passo 4: Verificar e corrigir foreign keys
    console.log("🔍 Passo 4: Verificando integridade das foreign keys...");
    const allUserWorkspaces = await prisma.userWorkspace.findMany({
      select: { userId: true, workspaceId: true }
    });

    const allUserIds = await prisma.user.findMany({ select: { id: true } });
    const validUserIds = new Set(allUserIds.map(u => u.id));

    const allWorkspaceIds = await prisma.workspace.findMany({ select: { id: true } });
    const validWorkspaceIds = new Set(allWorkspaceIds.map(w => w.id));

    const orphanUserWorkspaces = allUserWorkspaces.filter(
      uw => !validUserIds.has(uw.userId) || !validWorkspaceIds.has(uw.workspaceId)
    );

    if (orphanUserWorkspaces.length > 0) {
      console.log(`   ⚠️  Encontrados ${orphanUserWorkspaces.length} registros órfãos.`);
      console.log("   🧹 Removendo registros órfãos...");
      
      for (const orphan of orphanUserWorkspaces) {
        try {
          await prisma.userWorkspace.delete({
            where: {
              userId_workspaceId: {
                userId: orphan.userId,
                workspaceId: orphan.workspaceId
              }
            }
          });
        } catch (error) {
          // Ignorar se já foi deletado
        }
      }
      console.log("   ✅ Registros órfãos removidos.\n");
    } else {
      console.log("   ✅ Nenhum registro órfão encontrado.\n");
    }

    // Passo 5: Verificar activeWorkspaceId inválidos
    console.log("🎯 Passo 5: Verificando activeWorkspaceId...");
    const usersWithInvalidActiveWorkspace = await prisma.user.findMany({
      where: {
        activeWorkspaceId: {
          not: null
        }
      },
      select: {
        id: true,
        email: true,
        activeWorkspaceId: true,
        workspaces: {
          select: {
            workspaceId: true
          }
        }
      }
    });

    const invalidActiveWorkspaces = usersWithInvalidActiveWorkspace.filter(
      u => u.activeWorkspaceId && !validWorkspaceIds.has(u.activeWorkspaceId)
    );

    const usersWithoutAccess = usersWithInvalidActiveWorkspace.filter(
      u => u.activeWorkspaceId && !u.workspaces.some(w => w.workspaceId === u.activeWorkspaceId)
    );

    const totalInvalid = invalidActiveWorkspaces.length + usersWithoutAccess.length;

    if (totalInvalid > 0) {
      console.log(`   ⚠️  Encontrados ${totalInvalid} usuários com activeWorkspaceId inválido.`);
      console.log("   🧹 Corrigindo...");
      
      for (const user of [...invalidActiveWorkspaces, ...usersWithoutAccess]) {
        const firstWorkspace = user.workspaces[0];
        await prisma.user.update({
          where: { id: user.id },
          data: { activeWorkspaceId: firstWorkspace?.workspaceId || null }
        });
      }
      console.log("   ✅ activeWorkspaceId corrigidos.\n");
    } else {
      console.log("   ✅ Todos os activeWorkspaceId são válidos.\n");
    }

    console.log("✅ Correção completa finalizada! O banco de dados está limpo e sincronizado.");
    console.log("\n💡 Dica: Se o erro persistir, reinicie o servidor de desenvolvimento.");
    
  } catch (error) {
    console.error("\n❌ Erro durante a correção:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

