/**
 * Script de teste para verificar envio de emails via Resend
 * 
 * Uso:
 *   npx tsx scripts/test-email.ts seu-email@exemplo.com
 * 
 * Ou:
 *   npm run test:email seu-email@exemplo.com
 */

// IMPORTANTE: Carrega .env ANTES de importar qualquer módulo que use variáveis de ambiente
import { config } from "dotenv";
import { resolve } from "path";

// Carrega .env da raiz do projeto
// Isso DEVE acontecer antes de qualquer import que use process.env
const envResult = config({ path: resolve(process.cwd(), ".env") });

if (envResult.error) {
  console.warn("⚠️ Aviso: Não foi possível carregar .env:", envResult.error.message);
}

// Só importa depois de carregar o .env
import { sendWelcomeEmail } from "../lib/email/send-email";

async function main() {
  console.log("🧪 Testando sistema de emails...\n");

  // Verifica variáveis de ambiente
  console.log("📋 Verificando variáveis de ambiente:");
  console.log(`   RESEND_API_KEY: ${process.env.RESEND_API_KEY ? "✅ Configurada" : "❌ Não configurada"}`);
  console.log(`   EMAIL_FROM: ${process.env.EMAIL_FROM || "❌ Não configurada"}`);
  console.log(`   NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL || "❌ Não configurada"}`);
  console.log("");

  // Email de teste
  const testEmail = process.argv[2] || "teste@example.com";
  const testName = "Usuário de Teste";

  console.log(`📧 Tentando enviar email de teste para: ${testEmail}\n`);

  try {
    await sendWelcomeEmail(testEmail, testName);
    console.log("✅ Email enviado com sucesso!");
    console.log(`   Verifique a caixa de entrada de ${testEmail}`);
    console.log("   (Pode estar na pasta de spam)");
  } catch (error) {
    console.error("❌ Erro ao enviar email:");
    console.error(error);
    
    if (error instanceof Error) {
      console.error("\n📝 Detalhes do erro:");
      console.error(`   Mensagem: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
    }
    
    process.exit(1);
  }
}

// Executa o teste
main()
  .then(() => {
    console.log("\n✨ Teste concluído!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Erro fatal:", error);
    process.exit(1);
  });

