import { prisma } from "@/lib/db";

/**
 * Script direto usando SQL raw para corrigir problemas de foreign key
 * Mais agressivo e eficiente que usar o Prisma Client
 */
async function main() {
  console.log("🔧 Corrigindo problemas de foreign key diretamente no banco...\n");

  try {
    await prisma.$connect();
    console.log("✅ Conectado ao banco de dados.\n");

    // 1. Remover UserWorkspace com userId inválido
    console.log("1. Removendo UserWorkspace com userId inválido...");
    const result1 = await prisma.$executeRawUnsafe(`
      DELETE FROM "UserWorkspace"
      WHERE "userId" NOT IN (SELECT id FROM "User")
    `);
    console.log(`   ✅ Removidos ${result1} registros órfãos.`);

    // 2. Remover UserWorkspace com workspaceId inválido
    console.log("\n2. Removendo UserWorkspace com workspaceId inválido...");
    const result2 = await prisma.$executeRawUnsafe(`
      DELETE FROM "UserWorkspace"
      WHERE "workspaceId" NOT IN (SELECT id FROM "Workspace")
    `);
    console.log(`   ✅ Removidos ${result2} registros órfãos.`);

    // 3. Corrigir activeWorkspaceId inválidos
    console.log("\n3. Corrigindo activeWorkspaceId inválidos...");
    const result3 = await prisma.$executeRawUnsafe(`
      UPDATE "User"
      SET "activeWorkspaceId" = NULL
      WHERE "activeWorkspaceId" IS NOT NULL
        AND "activeWorkspaceId" NOT IN (SELECT id FROM "Workspace")
    `);
    console.log(`   ✅ Corrigidos ${result3} registros.`);

    // 4. Corrigir activeWorkspaceId para usuários sem acesso ao workspace
    console.log("\n4. Corrigindo activeWorkspaceId para usuários sem acesso...");
    const result4 = await prisma.$executeRawUnsafe(`
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
        )
    `);
    console.log(`   ✅ Corrigidos ${result4} registros.`);

    // 5. Verificar integridade final
    console.log("\n5. Verificando integridade final...");
    const orphanCount = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(`
      SELECT COUNT(*) as count
      FROM "UserWorkspace" uw
      WHERE uw."userId" NOT IN (SELECT id FROM "User")
         OR uw."workspaceId" NOT IN (SELECT id FROM "Workspace")
    `);

    const count = Number(orphanCount[0]?.count || 0);
    if (count > 0) {
      console.log(`   ⚠️  Ainda existem ${count} registros órfãos.`);
    } else {
      console.log("   ✅ Nenhum registro órfão encontrado. Banco de dados limpo!");
    }

    console.log("\n✅ Correção completa finalizada!");
    console.log("\n💡 Próximos passos:");
    console.log("   1. Execute: npx prisma generate");
    console.log("   2. Reinicie o servidor de desenvolvimento");
    console.log("   3. Se estiver usando Prisma Studio, feche e abra novamente");

  } catch (error: any) {
    console.error("\n❌ Erro durante a correção:", error);
    
    if (error.code === "P2003") {
      console.error("\n🔴 ERRO DE FOREIGN KEY AINDA PRESENTE!");
      console.error("   Tente executar o script SQL diretamente no banco:");
      console.error("   psql $DATABASE_URL < scripts/fix-foreign-key-direct.sql");
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

