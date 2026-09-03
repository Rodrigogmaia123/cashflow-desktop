# ⚡ TESTE RÁPIDO - AGORA MESMO!

Guia rápido para testar se tudo está funcionando após configurar o `.env.local`.

---

## 🚀 PASSO 1: INICIAR SERVIDORES (2 TERMINAIS)

### Terminal 1 - Stripe CLI (MANTENHA RODANDO):

```powershell
cd "C:\Users\Usuário\Desktop\Cashflow Pro"
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

✅ Você deve ver:
```
> Ready! Your webhook signing secret is whsec_...
```

**⚠️ NÃO FECHE ESTE TERMINAL!**

---

### Terminal 2 - Next.js:

```powershell
cd "C:\Users\Usuário\Desktop\Cashflow Pro"
npm run dev
```

✅ Você deve ver:
- "Ready" ou "compiled successfully"
- Servidor rodando em `http://localhost:3000`
- **SEM erros** sobre Stripe não configurado

❌ **Se ver erros:**
- "STRIPE_SECRET_KEY não configurada" → Verifique o `.env.local`
- "STRIPE_WEBHOOK_SECRET não configurada" → Adicione a variável
- Reinicie o servidor após corrigir

---

## 🧪 PASSO 2: TESTAR WEBHOOKS (TERMINAL 3)

### Abra um novo terminal PowerShell:

```powershell
# Adicionar Stripe CLI ao PATH
$env:Path += ";$env:USERPROFILE\scoop\shims"

# Testar webhook
stripe trigger checkout.session.completed
```

### Verificar resultado:

**No Terminal 1 (Stripe CLI)**, você deve ver:
```
2024-12-20 XX:XX:XX --> checkout.session.completed [evt_xxxxx]
2024-12-20 XX:XX:XX <-- [200] POST http://localhost:3000/api/webhooks/stripe [evt_xxxxx]
```

✅ **Status 200** = Funcionando perfeitamente!
❌ **Status 500** = Erro no código (veja logs do Terminal 2)

**No Terminal 2 (Next.js)**, você deve ver logs como:
```
[webhook/stripe] Checkout session completed para subscription: cs_test_xxxxx
```

---

## 🌐 PASSO 3: TESTAR INTERFACE DE BILLING

### 3.1 Acessar a página:

Abra no navegador:
```
http://localhost:3000/app/billing
```

### 3.2 Você deve ver:

- ✅ Página carrega sem erros
- ✅ Planos PRO e BUSINESS aparecem
- ✅ Preços corretos (R$ 49 e R$ 99)
- ✅ Botões de assinatura funcionam

### 3.3 Se pedir login:

1. Acesse: `http://localhost:3000/register`
2. Crie uma conta
3. Faça login
4. Volte para `/app/billing`

---

## 💳 PASSO 4: TESTAR CHECKOUT (OPCIONAL)

### 4.1 Criar assinatura:

1. Na página de billing, clique em "Assinar" em um plano
2. Você será redirecionado para o Stripe Checkout

### 4.2 Usar cartão de teste:

**Cartão que funciona:**
- **Número:** `4242 4242 4242 4242`
- **Data:** Qualquer data futura (ex: `12/25`)
- **CVC:** Qualquer 3 dígitos (ex: `123`)
- **CEP:** Qualquer CEP válido (ex: `01310-100`)

### 4.3 Verificar webhook:

Após completar o checkout:

1. **Terminal 1 (Stripe CLI)** - Deve mostrar eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - Status 200 para ambos

2. **Terminal 2 (Next.js)** - Deve mostrar logs:
   ```
   [webhook/stripe] Checkout session completed para subscription: cs_test_xxxxx
   [webhook/stripe] Subscription created: sub_xxxxx
   [stripe] Usuário xxxxx atualizado para plano PRO
   ```

3. **Banco de dados** - Plano do usuário deve ser atualizado

---

## ✅ CHECKLIST RÁPIDO

- [ ] Terminal 1: Stripe CLI rodando (`stripe listen`)
- [ ] Terminal 2: Next.js rodando (`npm run dev`) SEM erros
- [ ] Teste: `stripe trigger checkout.session.completed` retorna status 200
- [ ] Página `/app/billing` carrega corretamente
- [ ] Planos aparecem na interface
- [ ] (Opcional) Checkout funciona com cartão de teste

---

## 🆘 PROBLEMAS RÁPIDOS

### ❌ "stripe: comando não encontrado"

```powershell
$env:Path += ";$env:USERPROFILE\scoop\shims"
```

### ❌ Webhook retorna 500

1. Veja os logs do Terminal 2 (Next.js)
2. Verifique se `STRIPE_WEBHOOK_SECRET` está correto no `.env.local`
3. Reinicie o servidor Next.js

### ❌ Servidor não inicia

1. Verifique se o arquivo é `.env.local` (não `.env`)
2. Verifique se todas as variáveis estão configuradas
3. Reinicie o servidor

---

## 🎉 SE TUDO FUNCIONOU!

Parabéns! 🎊 Sua configuração do Stripe está completa e funcionando!

**Próximos passos:**
1. ✅ Continue desenvolvendo funcionalidades
2. ✅ Teste outros eventos de webhook
3. ✅ Teste atualização/cancelamento de plano
4. ✅ Implemente features específicas de cada plano

---

**Boa sorte! 🚀**

