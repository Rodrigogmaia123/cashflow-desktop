import { prisma } from "@/lib/db";

/**
 * Script para diagnosticar e corrigir problemas de chave estrangeira
 * relacionados a UserWorkspace
 */
async function main() {
  console.log("🔍 Diagnosticando problemas de chave estrangeira...\n");

  try {
    // 1. Verificar UserWorkspace órfãos (userId que não existe)
    console.log("1. Verificando UserWorkspace com userId inválido...");
    const allUserWorkspaces = await prisma.userWorkspace.findMany({
      select: {
        userId: true,
        workspaceId: true,
        role: true
      }
    });

    const allUserIds = await prisma.user.findMany({
      select: { id: true }
    });
    const validUserIds = new Set(allUserIds.map(u => u.id));

    const orphanUserWorkspaces = allUserWorkspaces.filter(
      uw => !validUserIds.has(uw.userId)
    );

    if (orphanUserWorkspaces.length > 0) {
      console.log(`   ⚠️  Encontrados ${orphanUserWorkspaces.length} registros órfãos:`);
      orphanUserWorkspaces.forEach(uw => {
        console.log(`      - userId: ${uw.userId}, workspaceId: ${uw.workspaceId}`);
      });

      console.log("\n   🧹 Removendo registros órfãos...");
      for (const orphan of orphanUserWorkspaces) {
        await prisma.userWorkspace.delete({
          where: {
            userId_workspaceId: {
              userId: orphan.userId,
              workspaceId: orphan.workspaceId
            }
          }
        });
      }
      console.log("   ✅ Registros órfãos removidos com sucesso!");
    } else {
      console.log("   ✅ Nenhum registro órfão encontrado.");
    }

    // 2. Verificar UserWorkspace órfãos (workspaceId que não existe)
    console.log("\n2. Verificando UserWorkspace com workspaceId inválido...");
    const allWorkspaceIds = await prisma.workspace.findMany({
      select: { id: true }
    });
    const validWorkspaceIds = new Set(allWorkspaceIds.map(w => w.id));

    const orphanWorkspaceUserWorkspaces = allUserWorkspaces.filter(
      uw => !validWorkspaceIds.has(uw.workspaceId)
    );

    if (orphanWorkspaceUserWorkspaces.length > 0) {
      console.log(`   ⚠️  Encontrados ${orphanWorkspaceUserWorkspaces.length} registros órfãos:`);
      orphanWorkspaceUserWorkspaces.forEach(uw => {
        console.log(`      - userId: ${uw.userId}, workspaceId: ${uw.workspaceId}`);
      });

      console.log("\n   🧹 Removendo registros órfãos...");
      for (const orphan of orphanWorkspaceUserWorkspaces) {
        await prisma.userWorkspace.delete({
          where: {
            userId_workspaceId: {
              userId: orphan.userId,
              workspaceId: orphan.workspaceId
            }
          }
        });
      }
      console.log("   ✅ Registros órfãos removidos com sucesso!");
    } else {
      console.log("   ✅ Nenhum registro órfão encontrado.");
    }

    // 3. Verificar Users sem UserWorkspace (pode ser normal, mas vamos reportar)
    console.log("\n3. Verificando Users sem UserWorkspace...");
    const usersWithoutWorkspace = await prisma.user.findMany({
      where: {
        workspaces: {
          none: {}
        }
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    if (usersWithoutWorkspace.length > 0) {
      console.log(`   ⚠️  Encontrados ${usersWithoutWorkspace.length} usuários sem workspace:`);
      usersWithoutWorkspace.forEach(u => {
        console.log(`      - ${u.email} (${u.name || "sem nome"})`);
      });
      console.log("   ℹ️  Isso pode ser normal se o usuário ainda não completou o onboarding.");
    } else {
      console.log("   ✅ Todos os usuários têm pelo menos um workspace.");
    }

    // 4. Verificar Workspaces sem usuários
    console.log("\n4. Verificando Workspaces sem usuários...");
    const workspacesWithoutUsers = await prisma.workspace.findMany({
      where: {
        users: {
          none: {}
        }
      },
      select: {
        id: true,
        name: true
      }
    });

    if (workspacesWithoutUsers.length > 0) {
      console.log(`   ⚠️  Encontrados ${workspacesWithoutUsers.length} workspaces sem usuários:`);
      workspacesWithoutUsers.forEach(w => {
        console.log(`      - ${w.name} (${w.id})`);
      });
      console.log("   ℹ️  Esses workspaces podem ser removidos se não tiverem dados importantes.");
    } else {
      console.log("   ✅ Todos os workspaces têm pelo menos um usuário.");
    }

    // 5. Verificar activeWorkspaceId inválidos
    console.log("\n5. Verificando activeWorkspaceId inválidos...");
    const usersWithInvalidActiveWorkspace = await prisma.user.findMany({
      where: {
        activeWorkspaceId: {
          not: null
        }
      },
      select: {
        id: true,
        email: true,
        activeWorkspaceId: true
      }
    });

    const invalidActiveWorkspaces = usersWithInvalidActiveWorkspace.filter(
      u => u.activeWorkspaceId && !validWorkspaceIds.has(u.activeWorkspaceId)
    );

    if (invalidActiveWorkspaces.length > 0) {
      console.log(`   ⚠️  Encontrados ${invalidActiveWorkspaces.length} usuários com activeWorkspaceId inválido:`);
      invalidActiveWorkspaces.forEach(u => {
        console.log(`      - ${u.email}: activeWorkspaceId = ${u.activeWorkspaceId}`);
      });

      console.log("\n   🧹 Corrigindo activeWorkspaceId inválidos...");
      for (const user of invalidActiveWorkspaces) {
        await prisma.user.update({
          where: { id: user.id },
          data: { activeWorkspaceId: null }
        });
      }
      console.log("   ✅ activeWorkspaceId inválidos corrigidos!");
    } else {
      console.log("   ✅ Todos os activeWorkspaceId são válidos.");
    }

    // 6. Verificar se usuários têm acesso ao workspace ativo
    console.log("\n6. Verificando se usuários têm acesso ao workspace ativo...");
    const usersWithActiveWorkspace = await prisma.user.findMany({
      where: {
        activeWorkspaceId: {
          not: null
        }
      },
      include: {
        workspaces: true
      }
    });

    const usersWithoutAccess = usersWithActiveWorkspace.filter(
      u => u.activeWorkspaceId && !u.workspaces.some(w => w.workspaceId === u.activeWorkspaceId)
    );

    if (usersWithoutAccess.length > 0) {
      console.log(`   ⚠️  Encontrados ${usersWithoutAccess.length} usuários sem acesso ao workspace ativo:`);
      usersWithoutAccess.forEach(u => {
        console.log(`      - ${u.email}: activeWorkspaceId = ${u.activeWorkspaceId}`);
      });

      console.log("\n   🧹 Corrigindo activeWorkspaceId...");
      for (const user of usersWithoutAccess) {
        // Definir o primeiro workspace do usuário como ativo, ou null se não tiver nenhum
        const firstWorkspace = user.workspaces[0];
        await prisma.user.update({
          where: { id: user.id },
          data: { activeWorkspaceId: firstWorkspace?.workspaceId || null }
        });
      }
      console.log("   ✅ activeWorkspaceId corrigidos!");
    } else {
      console.log("   ✅ Todos os usuários têm acesso ao workspace ativo.");
    }

    console.log("\n✅ Diagnóstico completo! O banco de dados está limpo.");
  } catch (error) {
    console.error("❌ Erro durante o diagnóstico:", error);
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

