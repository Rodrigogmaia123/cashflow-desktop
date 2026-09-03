/**
 * Cliente Resend - Server Only
 * NUNCA importar no client
 * 
 * Usa lazy initialization para permitir que dotenv carregue antes
 */

import { Resend } from "resend";

// Lazy initialization - cria o cliente apenas quando necessário
let _resend: Resend | null = null;

/**
 * Obtém o cliente Resend (lazy initialization)
 * Permite que dotenv carregue antes da inicialização
 */
export function getResend(): Resend | null {
  // Se já foi inicializado, retorna
  if (_resend !== null) {
    return _resend;
  }

  // Verifica se API key está disponível agora
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey || /not_used|desktop_local/i.test(apiKey)) {
    // Só lança erro em produção explícita (Vercel)
    if (!apiKey && process.env.NODE_ENV === "production" && process.env.VERCEL) {
      throw new Error("RESEND_API_KEY não configurada");
    }
    
    // Em desenvolvimento, apenas retorna null
    return null;
  }

  // Cria o cliente
  _resend = new Resend(apiKey);
  return _resend;
}

// Exporta a função getResend para uso
export { getResend as resend };

// Para desenvolvimento, usa domínio padrão do Resend (não precisa verificar)
// Para produção, configure um domínio verificado no Resend
export const EMAIL_FROM = process.env.EMAIL_FROM || "Cashflow Pro <onboarding@resend.dev>";

