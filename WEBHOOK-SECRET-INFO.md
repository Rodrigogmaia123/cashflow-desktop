# 🔑 WEBHOOK SECRET GERADO - CONFIGURAÇÃO RÁPIDA

## ✅ Webhook Secret do Stripe CLI

Você já tem o webhook secret gerado pelo Stripe CLI:

```
whsec_...
```

## 📝 CONFIGURE SEU .env.local

Adicione ou atualize esta linha no seu arquivo `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

## ✅ VARIÁVEIS COMPLETAS DO STRIPE

Seu `.env.local` deve ter todas essas variáveis do Stripe:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_xxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_ID_BUSINESS=price_xxxxxxxxxxxxxxxxxxxxxxxxxx

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## ⚠️ IMPORTANTE

- **STRIPE_WEBHOOK_SECRET**: Use o secret do `stripe listen` (o que você acabou de copiar) ✅
- **STRIPE_SECRET_KEY**: Copie do dashboard Stripe (https://dashboard.stripe.com/test/apikeys)
- **STRIPE_PRICE_ID_PRO e STRIPE_PRICE_ID_BUSINESS**: Os que você copiou ao criar os produtos

## 🧪 TESTAR AGORA

Após atualizar o `.env.local`:

1. **Reinicie o servidor Next.js** (Ctrl+C e depois `npm run dev`)
2. **Mantenha o `stripe listen` rodando** (não feche aquele terminal!)
3. **Teste com:**

```powershell
# Atualizar PATH temporariamente
$env:Path += ";$env:USERPROFILE\scoop\shims"

# Testar evento
stripe trigger checkout.session.completed
```

Você deve ver:
- No terminal do `stripe listen`: Status 200 ✅
- No terminal do Next.js: Logs do webhook sendo processado

