# ✅ RESUMO: Configuração de Webhooks - STATUS ATUAL

## 🎯 O QUE JÁ FOI FEITO

✅ Stripe CLI instalado e funcionando  
✅ Login no Stripe CLI realizado  
✅ Webhook secret gerado pelo Stripe CLI  
✅ Stripe CLI rodando em modo listen (Terminal 1)

## 🔑 SEU WEBHOOK SECRET

```
whsec_...
```

**⚠️ IMPORTANTE:** Este é o secret que você deve usar no `.env.local` enquanto desenvolve localmente!

---

## 📋 PRÓXIMOS PASSOS

### 1️⃣ Configurar .env.local

Abra ou crie o arquivo `.env.local` na raiz do projeto e adicione:

```env
# Stripe Webhook Secret (do Stripe CLI)
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Secret Key (do dashboard Stripe)
STRIPE_SECRET_KEY=sk_test_...

# Stripe Price IDs (dos produtos que você criou)
STRIPE_PRICE_ID_PRO=price_xxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_ID_BUSINESS=price_xxxxxxxxxxxxxxxxxxxxxxxxxx

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2️⃣ Reiniciar Servidor Next.js

Após atualizar o `.env.local`, **reinicie o servidor Next.js**:

```powershell
# Pare o servidor (Ctrl+C se estiver rodando)
# Depois inicie novamente:
npm run dev
```

### 3️⃣ Testar Webhooks

Em um **novo terminal PowerShell**, execute:

```powershell
# Adicionar Stripe CLI ao PATH (se necessário)
$env:Path += ";$env:USERPROFILE\scoop\shims"

# Testar evento
stripe trigger checkout.session.completed
```

### 4️⃣ Verificar Logs

**Terminal 1 (stripe listen)** deve mostrar:
```
2024-12-20 XX:XX:XX --> checkout.session.completed [evt_xxxxx]
2024-12-20 XX:XX:XX <-- [200] POST http://localhost:3000/api/webhooks/stripe [evt_xxxxx]
```

**Status 200** = ✅ Funcionando!  
**Status 500** = ❌ Verifique os logs do Next.js

---

## 🔄 WORKFLOW COMPLETO (Todo dia de desenvolvimento)

### Terminal 1 - Stripe CLI (MANTENHA RODANDO):
```powershell
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

### Terminal 2 - Next.js:
```powershell
npm run dev
```

### Terminal 3 - Testes (quando necessário):
```powershell
$env:Path += ";$env:USERPROFILE\scoop\shims"
stripe trigger checkout.session.completed
```

---

## 🎯 VARIÁVEIS QUE VOCÊ PRECISA

| Variável | Onde Obter | Status |
|----------|------------|--------|
| `STRIPE_WEBHOOK_SECRET` | Terminal do `stripe listen` | ✅ Já tem! |
| `STRIPE_SECRET_KEY` | Dashboard Stripe → API Keys | ⚠️ Precisa copiar |
| `STRIPE_PRICE_ID_PRO` | Dashboard Stripe → Products | ⚠️ Precisa copiar |
| `STRIPE_PRICE_ID_BUSINESS` | Dashboard Stripe → Products | ⚠️ Precisa copiar |
| `NEXT_PUBLIC_APP_URL` | Configuração local | ✅ Já configurado |

---

## 📚 COMANDOS ÚTEIS

### Ver eventos recentes:
```powershell
$env:Path += ";$env:USERPROFILE\scoop\shims"
stripe events list --limit 10
```

### Testar eventos específicos:
```powershell
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_succeeded
```

### Ver versão do Stripe CLI:
```powershell
$env:Path += ";$env:USERPROFILE\scoop\shims"
stripe --version
```

---

## 🆘 PROBLEMAS COMUNS

### ❌ "stripe: comando não encontrado"

**Solução:** Execute antes dos comandos:
```powershell
$env:Path += ";$env:USERPROFILE\scoop\shims"
```

Ou feche e abra um novo terminal PowerShell (o PATH será atualizado automaticamente).

### ❌ Webhook retorna 500

1. Verifique se o servidor Next.js está rodando
2. Verifique se o `.env.local` tem o `STRIPE_WEBHOOK_SECRET` correto
3. Veja os logs do Next.js para detalhes do erro

### ❌ "STRIPE_WEBHOOK_SECRET não configurada"

1. Certifique-se que o arquivo é `.env.local` (não `.env`)
2. Verifique se não há espaços extras na variável
3. Reinicie o servidor Next.js após atualizar

---

## ✅ CHECKLIST FINAL

- [ ] Webhook secret copiado: `whsec_...`
- [ ] `.env.local` criado/atualizado com `STRIPE_WEBHOOK_SECRET`
- [ ] `STRIPE_SECRET_KEY` configurada (do dashboard)
- [ ] `STRIPE_PRICE_ID_PRO` configurado (dos produtos)
- [ ] `STRIPE_PRICE_ID_BUSINESS` configurado (dos produtos)
- [ ] Servidor Next.js reiniciado
- [ ] `stripe listen` rodando (Terminal 1)
- [ ] Teste realizado: `stripe trigger checkout.session.completed`
- [ ] Status 200 confirmado nos logs

---

**🎉 Agora você está pronto para testar webhooks localmente!**

