# 🔧 SOLUÇÃO: Erro "No such price: 'prod_...'"

## ❌ PROBLEMA

Quando você executa:
```powershell
stripe trigger checkout.session.completed
```

Recebe o erro:
```
No such price: 'prod_TdmNHxDn111RXN'
```

## 🔍 CAUSA

O Stripe CLI cria fixtures de teste (produtos/prices fictícios) que **não correspondem** aos Price IDs reais que você configurou no `.env.local`.

O erro mostra que está tentando usar um **Product ID** (`prod_...`) quando deveria usar um **Price ID** (`price_...`).

---

## ✅ SOLUÇÕES

### Solução 1: Testar com Price IDs Reais (RECOMENDADO)

Em vez de usar `stripe trigger`, teste criando uma sessão de checkout real através da sua aplicação:

1. **Acesse a página de billing:**
   ```
   http://localhost:3000/app/billing
   ```

2. **Clique em "Assinar" em um dos planos**

3. **Complete o checkout com cartão de teste:**
   - Número: `4242 4242 4242 4242`
   - Data: `12/25` (qualquer data futura)
   - CVC: `123`
   - CEP: Qualquer CEP válido

4. **Isso vai:**
   - Usar os Price IDs reais do seu `.env.local`
   - Criar uma sessão de checkout real
   - Disparar os webhooks corretos
   - Atualizar o plano do usuário no banco

---

### Solução 2: Usar Stripe CLI com Fixture Customizado

Crie um arquivo `test_checkout.json` na raiz do projeto:

```json
{
  "product": {
    "name": "PRO",
    "description": "Plano PRO"
  },
  "price": {
    "unit_amount": 4900,
    "currency": "brl",
    "recurring": {
      "interval": "month"
    },
    "product": "${product}"
  },
  "checkout_session": {
    "mode": "subscription",
    "line_items": [
      {
        "price": "${price}",
        "quantity": 1
      }
    ],
    "success_url": "http://localhost:3000/app/billing?success=true",
    "cancel_url": "http://localhost:3000/app/billing?canceled=true"
  }
}
```

Depois use:
```powershell
stripe fixtures test_checkout.json
```

⚠️ **Nota:** Isso ainda cria produtos temporários. A Solução 1 é melhor!

---

### Solução 3: Testar Eventos Diretamente (Sem Checkout)

Teste eventos de subscription diretamente:

```powershell
# Testar subscription criada
stripe trigger customer.subscription.created

# Testar subscription atualizada
stripe trigger customer.subscription.updated

# Testar subscription deletada
stripe trigger customer.subscription.deleted

# Testar pagamento bem-sucedido
stripe trigger invoice.payment_succeeded
```

⚠️ **Limitação:** Esses eventos não terão os Price IDs reais do seu sistema, então o webhook pode falhar ao mapear para planos.

---

### Solução 4: Criar Checkout Session Manualmente

Use o Stripe CLI para criar uma sessão com seus Price IDs reais:

```powershell
# Substitua price_xxxxx pelo seu STRIPE_PRICE_ID_PRO do .env.local
stripe checkout sessions create \
  --success-url="http://localhost:3000/app/billing?success=true" \
  --cancel-url="http://localhost:3000/app/billing?canceled=true" \
  --mode=subscription \
  --line-items[][price]=price_xxxxxxxxxxxxxxxxxxxxxxxxxx \
  --line-items[][quantity]=1
```

Isso criará uma sessão real que você pode completar no navegador.

---

## 🎯 RECOMENDAÇÃO FINAL

**Use a Solução 1** (testar através da aplicação):

1. ✅ Usa os Price IDs reais do `.env.local`
2. ✅ Testa o fluxo completo
3. ✅ Verifica se tudo está integrado corretamente
4. ✅ Mais próximo do comportamento real

---

## ✅ COMO TESTAR CORRETAMENTE

### 1. Iniciar servidores:

**Terminal 1:**
```powershell
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

**Terminal 2:**
```powershell
npm run dev
```

### 2. Acessar a aplicação:

1. Abra: `http://localhost:3000/app/billing`
2. Faça login (se necessário)
3. Clique em "Assinar" em um plano
4. Complete o checkout com cartão de teste

### 3. Verificar webhooks:

**Terminal 1 (Stripe CLI)** deve mostrar:
```
--> checkout.session.completed [evt_xxxxx]
<-- [200] POST http://localhost:3000/api/webhooks/stripe [evt_xxxxx]
--> customer.subscription.created [evt_xxxxx]
<-- [200] POST http://localhost:3000/api/webhooks/stripe [evt_xxxxx]
```

**Terminal 2 (Next.js)** deve mostrar:
```
[webhook/stripe] Checkout session completed para subscription: cs_test_xxxxx
[webhook/stripe] Subscription created: sub_xxxxx
[stripe] Plano resolvido via mapa canônico: price_xxxxx → PRO
[stripe] Usuário xxxxx atualizado para plano PRO
```

---

## 🆘 SE AINDA DER ERRO

### Verificar se Price IDs estão corretos:

1. Confirme que no `.env.local` você tem:
   ```env
   STRIPE_PRICE_ID_PRO=price_xxxxxxxxxxxxxxxxxxxxxxxxxx
   STRIPE_PRICE_ID_BUSINESS=price_xxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

2. Verifique se são Price IDs (começam com `price_`), não Product IDs (`prod_`)

3. Confirme que estão no modo TEST (não live)

4. Verifique no dashboard: https://dashboard.stripe.com/test/products

---

## 📚 RESUMO

- ❌ **Erro:** `stripe trigger checkout.session.completed` usa fixtures que não correspondem aos seus Price IDs
- ✅ **Solução:** Teste através da aplicação real (`/app/billing`) usando os Price IDs configurados
- ✅ **Alternativa:** Use eventos de subscription diretamente, mas podem falhar no mapeamento

**A melhor forma de testar é usar a aplicação real!** 🚀

