# Template de Variáveis de Ambiente

Copie este conteúdo para um arquivo `.env` na raiz do projeto.

```env
# Database (PostgreSQL)
# Exemplo local:
DATABASE_URL="postgresql://user:password@localhost:5432/cashflow_pro?schema=public"
# Exemplo com variáveis:
# DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"

# NextAuth
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# GitHub OAuth (opcional)
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Email - Resend (OBRIGATÓRIO para emails transacionais)
RESEND_API_KEY="re_..."
EMAIL_FROM="Cashflow Pro <no-reply@cashflowpro.com>"

# Email - NextAuth (opcional, usado apenas se não usar Resend)
EMAIL_SERVER_HOST=""
EMAIL_SERVER_PORT=""
EMAIL_SERVER_USER=""
EMAIL_SERVER_PASSWORD=""

# Stripe (OBRIGATÓRIO para billing)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID_PRO="price_..."
STRIPE_PRICE_ID_BUSINESS="price_..."

# App URL (para callbacks e webhooks)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Como Obter as Chaves do Stripe

1. **STRIPE_SECRET_KEY**: 
   - Acesse https://dashboard.stripe.com/test/apikeys
   - Copie a "Secret key" (começa com `sk_test_`)

2. **STRIPE_WEBHOOK_SECRET**:
   - Acesse https://dashboard.stripe.com/test/webhooks
   - Crie um endpoint apontando para `https://seu-dominio.com/api/webhooks/stripe`
   - Copie o "Signing secret" (começa com `whsec_`)

3. **STRIPE_PRICE_ID_PRO e STRIPE_PRICE_ID_BUSINESS**:
   - Acesse https://dashboard.stripe.com/test/products
   - Crie dois produtos:
     - PRO: R$ 49,00/mês (recorrente)
     - BUSINESS: R$ 99,00/mês (recorrente)
   - Copie os Price IDs (começam com `price_`)

## Teste Local com Stripe CLI

Para testar webhooks localmente:

```bash
# Instale o Stripe CLI
# https://stripe.com/docs/stripe-cli

# Faça login
stripe login

# Escute webhooks localmente
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Use o webhook secret fornecido pelo CLI
```

