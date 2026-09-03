import 'dotenv/config';

const requiredEnvs = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'GITHUB_ID',
  'GITHUB_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'RESEND_API_KEY',
];

const missing = requiredEnvs.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Variáveis de ambiente faltando:');
  missing.forEach((key) => console.error(`- ${key}`));
  process.exit(1);
}

console.log('✅ Todas as variáveis de ambiente obrigatórias estão definidas');
