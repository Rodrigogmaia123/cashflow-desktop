/**
 * Script de teste completo - testa todos os templates de email
 * 
 * Uso:
 *   npx tsx scripts/test-all-emails.ts seu-email@exemplo.com
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
import {
  sendWelcomeEmail,
  sendResetPasswordEmail,
  sendMagicLinkEmail,
  sendSubscriptionConfirmedEmail,
  sendSubscriptionCanceledEmail,
  sendSubscriptionFailedEmail,
} from "../lib/email/send-email";
import crypto from "crypto";

async function main() {
  const testEmail = process.argv[2];

  if (!testEmail) {
    console.error("❌ Por favor, forneça um email de teste:");
    console.error("   npx tsx scripts/test-all-emails.ts seu-email@exemplo.com");
    process.exit(1);
  }

  console.log("🧪 Testando todos os templates de email...\n");
  console.log(`📧 Email de destino: ${testEmail}\n`);

  // Verifica variáveis de ambiente
  if (!process.env.RESEND_API_KEY) {
    console.error("❌ RESEND_API_KEY não configurada no .env");
    process.exit(1);
  }

  if (!process.env.EMAIL_FROM) {
    console.error("❌ EMAIL_FROM não configurada no .env");
    process.exit(1);
  }

  const tests = [
    {
      name: "📨 Email de Boas-vindas",
      fn: () => sendWelcomeEmail(testEmail, "João Silva"),
    },
    {
      name: "🔐 Email de Reset de Senha",
      fn: () => {
        const token = crypto.randomBytes(32).toString("hex");
        return sendResetPasswordEmail(testEmail, token);
      },
    },
    {
      name: "🔗 Email de Magic Link",
      fn: () => {
        const url = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/callback/email?token=test`;
        return sendMagicLinkEmail(testEmail, url);
      },
    },
    {
      name: "✅ Email de Assinatura Confirmada",
      fn: () => sendSubscriptionConfirmedEmail(testEmail, "PRO", "R$ 99,00"),
    },
    {
      name: "❌ Email de Assinatura Cancelada",
      fn: () => sendSubscriptionCanceledEmail(testEmail, "PRO"),
    },
    {
      name: "⚠️ Email de Falha de Pagamento",
      fn: () => sendSubscriptionFailedEmail(testEmail, "PRO", "R$ 99,00"),
    },
  ];

  let successCount = 0;
  let failCount = 0;

  for (const test of tests) {
    try {
      console.log(`Testando: ${test.name}...`);
      await test.fn();
      console.log(`   ✅ Enviado com sucesso!\n`);
      successCount++;
      
      // Aguarda 1 segundo entre emails para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`   ❌ Erro: ${error instanceof Error ? error.message : String(error)}\n`);
      failCount++;
    }
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📊 Resultado: ${successCount} sucesso, ${failCount} falhas`);
  console.log(`📧 Verifique a caixa de entrada de ${testEmail}`);
  console.log("   (Pode estar na pasta de spam)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("💥 Erro fatal:", error);
  process.exit(1);
});

