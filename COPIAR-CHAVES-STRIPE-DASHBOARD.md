# 🔑 GUIA COMPLETO: Copiar Chaves do Stripe Dashboard

## 📋 CHECKLIST RÁPIDO

Você precisa copiar 4 coisas do dashboard:
- [ ] **STRIPE_SECRET_KEY** (Secret Key)
- [ ] **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY** (Publishable Key)
- [ ] **STRIPE_PRICE_ID_PRO** (Price ID do produto PRO)
- [ ] **STRIPE_PRICE_ID_BUSINESS** (Price ID do produto BUSINESS)

---

## 🔐 PASSO 1: COPIAR SECRET KEY E PUBLISHABLE KEY

### 1. Acesse a página de API Keys:

🌐 **URL:** https://dashboard.stripe.com/test/apikeys

Ou navegue manualmente:
1. Faça login no Stripe Dashboard
2. No menu lateral esquerdo, clique em **"Developers"** (Desenvolvedores)
3. Depois clique em **"API keys"**

### 2. Certifique-se que está em **MODO TEST**

- No canto superior direito deve aparecer um switch/toggle
- Deve estar escrito **"Test mode"** ou **"Modo de teste"**
- Deve estar **ATIVADO** (posição ON)
- Você verá um banner amarelo no topo dizendo "Test mode"

### 3. Copiar Publishable Key

Na seção **"Publishable key"** (chave pública):

- Você verá algo como: `pk_test_51234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnop`
- **Clique no ícone de copiar** (📋) ao lado
- **Anote:** Esta é a `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

📝 **Formato:** Começa com `pk_test_...`

### 4. Copiar Secret Key

Na seção **"Secret key"** (chave secreta):

- Primeiro, clique no botão **"Reveal test key"** ou **"Revelar chave de teste"**
- Você verá algo como: `sk_test_...`
- **Clique no ícone de copiar** (📋) ao lado
- **Anote:** Esta é a `STRIPE_SECRET_KEY`

📝 **Formato:** Começa com `sk_test_...`

⚠️ **IMPORTANTE:** 
- **NUNCA** compartilhe ou exponha a Secret Key publicamente
- Use apenas `sk_test_...` (não `sk_live_...`) para desenvolvimento
- A Secret Key é como uma senha - mantenha em segredo!

---

## 💰 PASSO 2: COPIAR PRICE ID DO PRODUTO PRO

### 1. Acesse a página de Products:

🌐 **URL:** https://dashboard.stripe.com/test/products

Ou navegue manualmente:
1. No menu lateral esquerdo, clique em **"Products"** (Produtos)

### 2. Encontre o produto PRO

- Você deve ver uma lista de produtos
- Procure pelo produto **"PRO"** que você criou anteriormente
- Se não criou ainda, veja o guia: [CRIAR-PRODUTOS-STRIPE.md](#) (ou siga as instruções abaixo)

### 3. Abrir o produto PRO

- **Clique no nome do produto "PRO"**

### 4. Copiar Price ID

Na página do produto:

- Você verá uma seção **"Pricing"** (Preços)
- Dentro dessa seção, haverá o **Price ID**
- Formato: `price_xxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Clique no ícone de copiar** (📋) ao lado do Price ID
- **Anote:** Esta é a `STRIPE_PRICE_ID_PRO`

📝 **Formato:** Começa com `price_...`

💡 **Dica:** O Price ID é diferente do Product ID. Você precisa do **Price ID**, não do Product ID!

---

## 💼 PASSO 3: COPIAR PRICE ID DO PRODUTO BUSINESS

### 1. Voltar para a lista de produtos

- Clique em **"Products"** no menu lateral novamente
- Ou clique em **"← Back"** ou **"← Voltar"**

### 2. Encontrar o produto BUSINESS

- Procure pelo produto **"BUSINESS"** na lista
- Se não criou ainda, veja o guia: [CRIAR-PRODUTOS-STRIPE.md](#) (ou siga as instruções abaixo)

### 3. Abrir o produto BUSINESS

- **Clique no nome do produto "BUSINESS"**

### 4. Copiar Price ID

- Na seção **"Pricing"**, copie o **Price ID**
- Formato: `price_xxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Clique no ícone de copiar** (📋) ao lado
- **Anote:** Esta é a `STRIPE_PRICE_ID_BUSINESS`

📝 **Formato:** Começa com `price_...`

---

## ⚠️ SE VOCÊ AINDA NÃO CRIOU OS PRODUTOS

Se você ainda não criou os produtos PRO e BUSINESS, siga estes passos:

### Criar Produto PRO (R$ 49/mês):

1. Acesse: https://dashboard.stripe.com/test/products
2. Clique em **"Add product"** (Adicionar produto)
3. Preencha:
   - **Name:** `PRO`
   - **Description:** `Plano PRO - Ideal para pequenas empresas`
   - **Pricing model:** `Standard pricing`
   - **Price:** `49`
   - **Currency:** `BRL - Brazilian Real`
   - **Billing period:** `Monthly` (Mensal)
   - **Payment type:** `Recurring` (Recorrente)
4. Clique em **"Save product"**
5. **Copie o Price ID** que aparecer

### Criar Produto BUSINESS (R$ 99/mês):

1. Clique em **"Add product"** novamente
2. Preencha:
   - **Name:** `BUSINESS`
   - **Description:** `Plano BUSINESS - Para empresas em crescimento`
   - **Pricing model:** `Standard pricing`
   - **Price:** `99`
   - **Currency:** `BRL - Brazilian Real`
   - **Billing period:** `Monthly` (Mensal)
   - **Payment type:** `Recurring` (Recorrente)
3. Clique em **"Save product"**
4. **Copie o Price ID** que aparecer

---

## 📝 PASSO 4: ORGANIZAR AS CHAVES COPIADAS

Agora você deve ter copiado 4 valores. Organize-os assim:

```
1. NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_test_...
2. STRIPE_SECRET_KEY = sk_test_...
3. STRIPE_PRICE_ID_PRO = price_...
4. STRIPE_PRICE_ID_BUSINESS = price_...
```

---

## ⚙️ PASSO 5: CONFIGURAR NO .env.local

Agora vamos colocar tudo no arquivo `.env.local`:

### 1. Abra ou crie o arquivo `.env.local` na raiz do projeto

### 2. Adicione todas as variáveis:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Stripe Price IDs
STRIPE_PRICE_ID_PRO=price_xxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_ID_BUSINESS=price_xxxxxxxxxxxxxxxxxxxxxxxxxx

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Substitua os valores `xxx...` pelos valores reais que você copiou

### 4. Salve o arquivo

⚠️ **IMPORTANTE:**
- Não deixe espaços antes ou depois do `=`
- Não use aspas desnecessárias (a menos que o valor contenha espaços)
- Mantenha tudo em uma linha por variável

---

## ✅ VERIFICAÇÃO FINAL

Confira se todas as variáveis estão corretas:

- [ ] `STRIPE_SECRET_KEY` começa com `sk_test_`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` começa com `pk_test_`
- [ ] `STRIPE_WEBHOOK_SECRET` começa com `whsec_` (já configurado)
- [ ] `STRIPE_PRICE_ID_PRO` começa com `price_`
- [ ] `STRIPE_PRICE_ID_BUSINESS` começa com `price_`
- [ ] `NEXT_PUBLIC_APP_URL` está como `http://localhost:3000`

---

## 🧪 TESTAR CONFIGURAÇÃO

Após configurar tudo:

### 1. Reinicie o servidor Next.js

```powershell
# Pare o servidor (Ctrl+C)
# Depois inicie novamente:
npm run dev
```

### 2. Verifique se não há erros de inicialização

No terminal do Next.js, você NÃO deve ver erros como:
- ❌ "STRIPE_SECRET_KEY não configurada"
- ❌ "STRIPE_WEBHOOK_SECRET não configurada"
- ❌ "STRIPE_PRICE_ID_PRO e STRIPE_PRICE_ID_BUSINESS devem estar configurados"

### 3. Teste os webhooks (opcional)

```powershell
$env:Path += ";$env:USERPROFILE\scoop\shims"
stripe trigger checkout.session.completed
```

Você deve ver status 200 nos logs do `stripe listen`!

---

## 🆘 PROBLEMAS COMUNS

### ❌ "Invalid API Key provided"

**Solução:**
- Verifique se copiou a chave completa (elas são longas!)
- Certifique-se que está usando `sk_test_...` (não `pk_test_...`)
- Verifique se não há espaços extras no .env.local
- Certifique-se que está em modo TEST no dashboard

### ❌ "Price ID não encontrado"

**Solução:**
- Verifique se copiou o **Price ID** (começa com `price_`), não o Product ID (começa com `prod_`)
- Confirme que os produtos foram criados corretamente
- Verifique se está usando os Price IDs do modo TEST (não do modo live)

### ❌ Variáveis não são lidas pelo Next.js

**Solução:**
1. Certifique-se que o arquivo é `.env.local` (não `.env`)
2. Reinicie o servidor Next.js após atualizar
3. Verifique se não há erros de sintaxe no .env.local
4. Certifique-se que não há espaços extras antes/depois do `=`

---

## 📚 LINKS ÚTEIS

- **API Keys:** https://dashboard.stripe.com/test/apikeys
- **Products:** https://dashboard.stripe.com/test/products
- **Webhooks:** https://dashboard.stripe.com/test/webhooks
- **Documentação Stripe:** https://stripe.com/docs

---

## 🎉 PRONTO!

Agora você tem todas as chaves configuradas e pode começar a usar o sistema de billing!

**Próximos passos:**
1. ✅ Testar criação de checkout
2. ✅ Testar webhooks
3. ✅ Testar atualização de plano
4. ✅ Testar cancelamento

---

**Boa sorte com sua configuração! 🚀**

