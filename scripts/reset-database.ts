import { prisma } from "@/lib/db";
import { execSync } from "child_process";

/**
 * Script para resetar o banco de dados completamente
 * ⚠️ ATENÇÃO: Isso vai DELETAR TODOS OS DADOS!
 */
async function main() {
  console.log("⚠️  ATENÇÃO: Este script vai DELETAR TODOS OS DADOS do banco de dados!\n");

  try {
    // Verificar se estamos em desenvolvimento
    if (process.env.NODE_ENV === "production") {
      console.error("❌ ERRO: Não é possível resetar o banco em produção!");
      console.error("   Este script só funciona em desenvolvimento.");
      process.exit(1);
    }

    console.log("🔄 Iniciando reset do banco de dados...\n");

    // 1. Desconectar do Prisma
    console.log("1. Desconectando do banco...");
    await prisma.$disconnect();
    console.log("   ✅ Desconectado.\n");

    // 2. Resetar o banco (deleta tudo e recria)
    console.log("2. Resetando banco de dados...");
    console.log("   ⚠️  Isso vai DELETAR todos os dados!");
    try {
      execSync("npx prisma migrate reset --force", { 
        stdio: "inherit",
        env: { ...process.env, FORCE: "true" }
      });
      console.log("   ✅ Banco resetado com sucesso.\n");
    } catch (error: any) {
      // Se migrate reset não funcionar, tentar db push
      console.log("   ⚠️  migrate reset falhou, tentando db push...");
      try {
        execSync("npx prisma db push --force-reset", { 
          stdio: "inherit" 
        });
        console.log("   ✅ Banco resetado com db push.\n");
      } catch (pushError: any) {
        console.error("   ❌ Erro ao resetar:", pushError.message);
        throw pushError;
      }
    }

    // 3. Regenerar Prisma Client
    console.log("3. Regenerando Prisma Client...");
    try {
      execSync("npx prisma generate", { stdio: "inherit" });
      console.log("   ✅ Prisma Client regenerado.\n");
    } catch (error: any) {
      console.error("   ⚠️  Erro ao regenerar Prisma Client:", error.message);
    }

    // 4. Aplicar seed (opcional)
    const shouldSeed = process.argv.includes("--seed");
    if (shouldSeed) {
      console.log("4. Aplicando seed...");
      try {
        execSync("npm run db:seed", { stdio: "inherit" });
        console.log("   ✅ Seed aplicado com sucesso.\n");
      } catch (error: any) {
        console.error("   ⚠️  Erro ao aplicar seed:", error.message);
      }
    } else {
      console.log("4. Seed não aplicado (use --seed para aplicar).\n");
    }

    console.log("✅ Reset do banco de dados concluído!");
    console.log("\n💡 Próximos passos:");
    console.log("   - O banco está limpo e pronto para uso");
    console.log("   - Execute 'npm run db:seed' se quiser dados de exemplo");
    console.log("   - Reinicie o servidor de desenvolvimento");

  } catch (error: any) {
    console.error("\n❌ Erro durante o reset:", error);
    console.error("\n💡 Solução alternativa:");
    console.error("   1. Feche todas as conexões com o banco");
    console.error("   2. Execute manualmente: npx prisma migrate reset --force");
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
