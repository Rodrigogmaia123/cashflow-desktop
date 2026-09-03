# 📘 Guia Rápido - API de Orçamentos (Budgets)

## 🚀 Como Usar

### Pré-requisitos
- Usuário autenticado (NextAuth)
- Workspace ativo
- Categoria existente no workspace

---

## 📍 Endpoints

### Base URL
```
http://localhost:3000/api/budgets
```

---

## 1️⃣ Criar Orçamento

**Endpoint:** `POST /api/budgets`

**Headers:**
```
Content-Type: application/json
Cookie: next-auth.session-token=...
```

**Body:**
```json
{
  "categoryId": "clx123abc456",
  "name": "Orçamento Marketing Q1 2026",
  "amount": 15000,
  "periodType": "CUSTOM",
  "startDate": "2026-01-01T00:00:00.000Z",
  "endDate": "2026-03-31T23:59:59.999Z"
}
```

**Response (201):**
```json
{
  "budget": {
    "id": "cly789def012",
    "workspaceId": "clw456xyz789",
    "categoryId": "clx123abc456",
    "name": "Orçamento Marketing Q1 2026",
    "amount": "15000",
    "periodType": "CUSTOM",
    "startDate": "2026-01-01T00:00:00.000Z",
    "endDate": "2026-03-31T23:59:59.999Z",
    "createdBy": "clu999user123",
    "createdAt": "2026-02-15T23:00:00.000Z",
    "updatedAt": "2026-02-15T23:00:00.000Z",
    "category": {
      "id": "clx123abc456",
      "name": "Marketing",
      "type": "EXPENSE"
    }
  },
  "message": "Orçamento criado com sucesso"
}
```

---

## 2️⃣ Listar Orçamentos

**Endpoint:** `GET /api/budgets`

**Query Params (todos opcionais):**
- `categoryId` - Filtrar por categoria específica
- `periodType` - `MONTHLY` ou `CUSTOM`
- `isActive` - `true` para mostrar apenas orçamentos ativos no período atual

**Exemplos:**
```bash
# Todos os orçamentos
GET /api/budgets

# Apenas orçamentos da categoria Marketing
GET /api/budgets?categoryId=clx123abc456

# Apenas orçamentos mensais ativos
GET /api/budgets?periodType=MONTHLY&isActive=true
```

**Response (200):**
```json
{
  "budgets": [
    {
      "id": "cly789def012",
      "workspaceId": "clw456xyz789",
      "categoryId": "clx123abc456",
      "name": "Orçamento Marketing Q1 2026",
      "amount": "15000",
      "periodType": "CUSTOM",
      "startDate": "2026-01-01T00:00:00.000Z",
      "endDate": "2026-03-31T23:59:59.999Z",
      "createdBy": "clu999user123",
      "createdAt": "2026-02-15T23:00:00.000Z",
      "updatedAt": "2026-02-15T23:00:00.000Z",
      "category": {
        "id": "clx123abc456",
        "name": "Marketing",
        "type": "EXPENSE"
      },
      "spent": 8250.50,
      "remaining": 6749.50,
      "percentUsed": 55.0,
      "isOverBudget": false
    }
  ]
}
```

---

## 3️⃣ Buscar Orçamento por ID

**Endpoint:** `GET /api/budgets/:id`

**Exemplo:**
```bash
GET /api/budgets/cly789def012
```

**Response (200):**
```json
{
  "budget": {
    "id": "cly789def012",
    "name": "Orçamento Marketing Q1 2026",
    "amount": "15000",
    "spent": 8250.50,
    "remaining": 6749.50,
    "percentUsed": 55.0,
    "isOverBudget": false,
    "category": {
      "id": "clx123abc456",
      "name": "Marketing",
      "type": "EXPENSE"
    },
    "startDate": "2026-01-01T00:00:00.000Z",
    "endDate": "2026-03-31T23:59:59.999Z"
  }
}
```

---

## 4️⃣ Atualizar Orçamento

**Endpoint:** `PUT /api/budgets/:id`

**Body (todos campos opcionais):**
```json
{
  "name": "Orçamento Marketing Q1 2026 (Revisado)",
  "amount": 18000
}
```

**Response (200):**
```json
{
  "budget": {
    "id": "cly789def012",
    "name": "Orçamento Marketing Q1 2026 (Revisado)",
    "amount": "18000",
    "category": {
      "id": "clx123abc456",
      "name": "Marketing",
      "type": "EXPENSE"
    }
  },
  "message": "Orçamento atualizado com sucesso"
}
```

---

## 5️⃣ Deletar Orçamento

**Endpoint:** `DELETE /api/budgets/:id`

**Exemplo:**
```bash
DELETE /api/budgets/cly789def012
```

**Response (200):**
```json
{
  "message": "Orçamento deletado com sucesso"
}
```

---

## 🔒 Autenticação

Todas as rotas requerem autenticação via NextAuth. Certifique-se de:

1. Estar logado no sistema
2. Ter um workspace ativo
3. Ter permissão para gerenciar orçamentos no workspace

---

## ⚠️ Possíveis Erros

### 401 Unauthorized
```json
{
  "error": "Não autenticado"
}
```
**Solução:** Faça login primeiro

### 400 Bad Request
```json
{
  "error": "Nenhum workspace ativo"
}
```
**Solução:** Selecione um workspace

### 400 Bad Request (Validação)
```json
{
  "error": "Dados inválidos",
  "details": [
    {
      "path": ["amount"],
      "message": "Valor deve ser positivo"
    }
  ]
}
```
**Solução:** Corrija os dados conforme mensagens de erro

### 404 Not Found
```json
{
  "error": "Orçamento não encontrado"
}
```
**Solução:** Verifique se o ID está correto e se o orçamento pertence ao workspace

---

## 📊 Campos de Uso (Cálculos Automáticos)

Ao listar ou buscar orçamentos, o sistema calcula automaticamente:

- **`spent`**: Soma total de despesas da categoria no período
- **`remaining`**: Valor restante (`amount - spent`)
- **`percentUsed`**: Percentual usado (`spent / amount * 100`)
- **`isOverBudget`**: `true` se `spent > amount`

Esses cálculos são baseados nas despesas (`Expense`) cadastradas:
- Mesma categoria do orçamento
- Data entre `startDate` e `endDate`

---

## 🧪 Teste Rápido via cURL

```bash
# Criar orçamento
curl -X POST http://localhost:3000/api/budgets \
  -H "Content-Type: application/json" \
  -b "next-auth.session-token=YOUR_TOKEN" \
  -d '{
    "categoryId": "clx123abc456",
    "name": "Teste Orçamento",
    "amount": 5000,
    "periodType": "MONTHLY",
    "startDate": "2026-02-01",
    "endDate": "2026-02-28"
  }'

# Listar orçamentos
curl http://localhost:3000/api/budgets \
  -b "next-auth.session-token=YOUR_TOKEN"

# Buscar por ID
curl http://localhost:3000/api/budgets/cly789def012 \
  -b "next-auth.session-token=YOUR_TOKEN"

# Atualizar
curl -X PUT http://localhost:3000/api/budgets/cly789def012 \
  -H "Content-Type: application/json" \
  -b "next-auth.session-token=YOUR_TOKEN" \
  -d '{"amount": 6000}'

# Deletar
curl -X DELETE http://localhost:3000/api/budgets/cly789def012 \
  -b "next-auth.session-token=YOUR_TOKEN"
```

---

## 💡 Dicas

1. **Período Mensal**: Use `periodType: "MONTHLY"` com startDate no dia 1 e endDate no último dia do mês
2. **Período Custom**: Use `periodType: "CUSTOM"` para trimestres, semestres ou qualquer período
3. **Filtragem Ativa**: Use `?isActive=true` para ver orçamentos do período atual
4. **Validação de Datas**: O sistema valida que `endDate > startDate`
5. **Múltiplos Orçamentos**: Você pode ter vários orçamentos para a mesma categoria em períodos diferentes

---

## 🔗 Links Relacionados

- [Documentação Sprint 1](./SPRINT-1-BUDGETS.md)
- [Schema Prisma](../prisma/schema.prisma)
- [Tipos TypeScript](../types/budget.ts)
- [Serviços](../lib/domain/budget.ts)

---

**Última atualização:** 15 de Fevereiro de 2026
