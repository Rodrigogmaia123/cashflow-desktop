import { prisma } from "@/lib/db";

/**
 * Script para verificar se o Prisma Client está sincronizado
 * e se há problemas de conexão ou schema
 */
async function main() {
  console.log("🔍 Verificando Prisma Client...\n");

  try {
    // 1. Testar conexão
    console.log("1. Testando conexão com o banco de dados...");
    await prisma.$connect();
    console.log("   ✅ Conexão estabelecida com sucesso.");

    // 2. Verificar se as tabelas existem
    console.log("\n2. Verificando estrutura do banco...");
    
    // Verificar se User existe
    const userCount = await prisma.user.count();
    console.log(`   ✅ Tabela User existe (${userCount} registros)`);

    // Verificar se Workspace existe
    const workspaceCount = await prisma.workspace.count();
    console.log(`   ✅ Tabela Workspace existe (${workspaceCount} registros)`);

    // Verificar se UserWorkspace existe
    const userWorkspaceCount = await prisma.userWorkspace.count();
    console.log(`   ✅ Tabela UserWorkspace existe (${userWorkspaceCount} registros)`);

    // 3. Verificar integridade das foreign keys
    console.log("\n3. Verificando integridade das foreign keys...");
    
    // Verificar se todos os UserWorkspace têm userId válido
    const allUserWorkspaces = await prisma.userWorkspace.findMany({
      select: { userId: true, workspaceId: true }
    });

    const allUserIds = await prisma.user.findMany({
      select: { id: true }
    });
    const validUserIds = new Set(allUserIds.map(u => u.id));

    const invalidUserIds = allUserWorkspaces.filter(
      uw => !validUserIds.has(uw.userId)
    );

    if (invalidUserIds.length > 0) {
      console.log(`   ⚠️  Encontrados ${invalidUserIds.length} UserWorkspace com userId inválido`);
    } else {
      console.log("   ✅ Todos os userId são válidos");
    }

    // Verificar se todos os UserWorkspace têm workspaceId válido
    const allWorkspaceIds = await prisma.workspace.findMany({
      select: { id: true }
    });
    const validWorkspaceIds = new Set(allWorkspaceIds.map(w => w.id));

    const invalidWorkspaceIds = allUserWorkspaces.filter(
      uw => !validWorkspaceIds.has(uw.workspaceId)
    );

    if (invalidWorkspaceIds.length > 0) {
      console.log(`   ⚠️  Encontrados ${invalidWorkspaceIds.length} UserWorkspace com workspaceId inválido`);
    } else {
      console.log("   ✅ Todos os workspaceId são válidos");
    }

    // 4. Testar criação de um registro (rollback)
    console.log("\n4. Testando criação de registro (teste)...");
    try {
      // Buscar um usuário válido para teste
      const testUser = await prisma.user.findFirst({
        select: { id: true }
      });

      if (testUser) {
        // Buscar um workspace válido para teste
        const testWorkspace = await prisma.workspace.findFirst({
          select: { id: true }
        });

        if (testWorkspace) {
          // Verificar se já existe
          const existing = await prisma.userWorkspace.findUnique({
            where: {
              userId_workspaceId: {
                userId: testUser.id,
                workspaceId: testWorkspace.id
              }
            }
          });

          if (!existing) {
            // Tentar criar (vai fazer rollback depois)
            await prisma.$transaction(async (tx) => {
              await tx.userWorkspace.create({
                data: {
                  userId: testUser.id,
                  workspaceId: testWorkspace.id,
                  role: "MEMBER"
                }
              });
              // Rollback automático
              throw new Error("ROLLBACK_TEST");
            });
          } else {
            console.log("   ✅ Relacionamento já existe, pulando teste de criação");
          }
        } else {
          console.log("   ⚠️  Nenhum workspace encontrado para teste");
        }
      } else {
        console.log("   ⚠️  Nenhum usuário encontrado para teste");
      }
    } catch (error: any) {
      if (error.message === "ROLLBACK_TEST") {
        console.log("   ✅ Teste de criação passou (rollback executado)");
      } else {
        console.log(`   ⚠️  Erro no teste: ${error.message}`);
        throw error;
      }
    }

    console.log("\n✅ Verificação completa! O Prisma Client está funcionando corretamente.");
  } catch (error: any) {
    console.error("\n❌ Erro durante a verificação:", error);
    
    if (error.code === "P2003") {
      console.error("\n🔴 ERRO DE FOREIGN KEY DETECTADO!");
      console.error("   Execute: npm run fix:foreign-keys");
    } else if (error.code === "P1001") {
      console.error("\n🔴 ERRO DE CONEXÃO!");
      console.error("   Verifique a variável DATABASE_URL no arquivo .env");
    }
    
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

