# ✅ CHECKLIST COMPLETO: Configuração Stripe

Use este checklist para garantir que tudo está configurado corretamente!

---

## 📋 FASE 1: INSTALAÇÃO E LOGIN

- [ ] Stripe CLI instalado
- [ ] Login feito (`stripe login`)
- [ ] Comando `stripe --version` funciona
- [ ] Modo TEST ativado no dashboard Stripe

---

## 📋 FASE 2: PRODUTOS NO STRIPE

- [ ] Produto PRO criado (R$ 49/mês)
- [ ] Price ID do PRO copiado (`price_...`)
- [ ] Produto BUSINESS criado (R$ 99/mês)
- [ ] Price ID do BUSINESS copiado (`price_...`)

**Links úteis:**
- Dashboard Products: https://dashboard.stripe.com/test/products

---

## 📋 FASE 3: CHAVES DA API

- [ ] Publishable Key copiada (`pk_test_...`)
- [ ] Secret Key copiada (`sk_test_...`)
- [ ] Verificado que está em modo TEST

**Links úteis:**
- Dashboard API Keys: https://dashboard.stripe.com/test/apikeys

---

## 📋 FASE 4: WEBHOOKS (DESENVOLVIMENTO LOCAL)

- [ ] Stripe CLI rodando em modo listen
- [ ] Webhook secret copiado do terminal (`whsec_...`)
- [ ] Webhook secret adicionado ao `.env.local`

**Comando:**
```powershell
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

---

## 📋 FASE 5: CONFIGURAÇÃO .env.local

Verifique se todas estas variáveis estão no `.env.local`:

- [ ] `STRIPE_SECRET_KEY=sk_test_...` ✅
- [ ] `STRIPE_WEBHOOK_SECRET=whsec_...` ✅
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...` ✅
- [ ] `STRIPE_PRICE_ID_PRO=price_...` ✅
- [ ] `STRIPE_PRICE_ID_BUSINESS=price_...` ✅
- [ ] `NEXT_PUBLIC_APP_URL=http://localhost:3000` ✅

**Formato correto:**
- ✅ Sem espaços antes/depois do `=`
- ✅ Sem aspas desnecessárias
- ✅ Cada variável em uma linha

---

## 📋 FASE 6: TESTE

- [ ] Servidor Next.js iniciado (`npm run dev`)
- [ ] Sem erros de inicialização relacionados ao Stripe
- [ ] Stripe CLI rodando em modo listen (Terminal separado)
- [ ] Teste realizado: `stripe trigger checkout.session.completed`
- [ ] Status 200 confirmado nos logs do Stripe CLI
- [ ] Logs do webhook aparecem no terminal do Next.js

**Comando de teste:**
```powershell
$env:Path += ";$env:USERPROFILE\scoop\shims"
stripe trigger checkout.session.completed
```

---

## 🔍 VALIDAÇÃO RÁPIDA

### Verificar formato das chaves:

| Variável | Formato Correto | Exemplo |
|----------|-----------------|---------|
| `STRIPE_SECRET_KEY` | `sk_test_...` | `sk_test_51Abc...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | `whsec_76eb6f...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | `pk_test_51Xyz...` |
| `STRIPE_PRICE_ID_PRO` | `price_...` | `price_1Abc123...` |
| `STRIPE_PRICE_ID_BUSINESS` | `price_...` | `price_1Xyz789...` |

### ❌ Erros comuns:

- ❌ Usar `pk_test_...` como Secret Key (errado!)
- ❌ Usar `sk_live_...` em desenvolvimento (errado!)
- ❌ Usar Product ID (`prod_...`) em vez de Price ID (`price_...`)
- ❌ Usar webhook secret do dashboard em desenvolvimento local (errado!)
- ❌ Espaços extras no .env.local
- ❌ Aspas duplas desnecessárias

---

## 📚 LINKS RÁPIDOS

- **API Keys:** https://dashboard.stripe.com/test/apikeys
- **Products:** https://dashboard.stripe.com/test/products
- **Webhooks Dashboard:** https://dashboard.stripe.com/test/webhooks
- **Documentação:** https://stripe.com/docs

---

## 🎯 STATUS ATUAL DO PROJETO

**✅ Completado:**
- Stripe CLI instalado e funcionando
- Login realizado
- Webhook secret gerado: `whsec_...`

**⚠️ Pendente:**
- Configurar outras chaves no `.env.local` (veja: COPIAR-CHAVES-STRIPE-DASHBOARD.md)

---

## 📖 GUIAS CRIADOS

1. **COPIAR-CHAVES-STRIPE-DASHBOARD.md** - Como copiar todas as chaves
2. **CONFIGURAR-WEBHOOKS-STRIPE.md** - Guia completo de webhooks
3. **RESUMO-CONFIGURACAO-WEBHOOKS.md** - Resumo rápido
4. **CHECKLIST-COMPLETO-STRIPE.md** - Este arquivo
5. **.env.local.example** - Template de exemplo

---

## 🎉 PRÓXIMOS PASSOS APÓS COMPLETAR

1. ✅ Testar criação de checkout session
2. ✅ Testar webhooks funcionando
3. ✅ Testar atualização de plano
4. ✅ Testar cancelamento de assinatura
5. ✅ Testar fluxo completo de billing

---

**Use este checklist e marque cada item conforme for completando! ✅**

