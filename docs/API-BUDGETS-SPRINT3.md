# 📘 API de Orçamentos - Guia Completo (Sprint 3)

## 🎯 Novos Endpoints - Tempo Real e Análise

### Base URL
```
http://localhost:3000/api/budgets
```

---

## 🆕 1. Status dos Orçamentos

### GET /api/budgets/status

Retorna resumo completo e status de todos os orçamentos ativos do workspace.

**Headers:**
```
Cookie: next-auth.session-token=...
```

**Query Params (opcionais):**
- `onlyCritical=true` - Retorna apenas alertas críticos (exceeded e critical)

**Response (200 OK):**
```json
{
  "summary": {
    "totalBudgets": 5,
    "activeBudgets": 3,
    "budgetsWithAlerts": 2,
    "budgetsExceeded": 1,
    "totalBudgeted": 50000.00,
    "totalSpent": 42500.00,
    "totalRemaining": 7500.00,
    "overallPercentage": 85.0,
    "alerts": [
      {
        "budgetId": "clx123abc",
        "budgetName": "Marketing Fevereiro 2026",
        "categoryName": "Marketing",
        "level": "critical",
        "message": "Orçamento 'Marketing Fevereiro 2026' crítico: 92.5% usado...",
        "percentUsed": 92.5,
        "spent": 9250.00,
        "remaining": 750.00,
        "amount": 10000.00
      }
    ]
  },
  "timestamp": "2026-02-15T23:30:00.000Z"
}
```

**Response com onlyCritical=true:**
```json
{
  "alerts": [
    {
      "budgetId": "clx123abc",
      "budgetName": "Marketing Fevereiro 2026",
      "categoryName": "Marketing",
      "level": "exceeded",
      "message": "Orçamento 'Marketing Fevereiro 2026' estourado em R$ 1.250,00!",
      "percentUsed": 112.5,
      "spent": 11250.00,
      "remaining": -1250.00,
      "amount": 10000.00
    }
  ],
  "count": 1
}
```

---

## 🆕 2. Verificar Impacto de Despesa

### POST /api/budgets/check-impact

**IMPORTANTE:** Verifica o impacto de uma despesa **ANTES** de salvá-la. Use para mostrar alertas preventivos ao usuário.

**Headers:**
```
Content-Type: application/json
Cookie: next-auth.session-token=...
```

**Body:**
```json
{
  "categoryId": "clx123abc456",
  "amount": 1500.00,
  "date": "2026-02-15T00:00:00.000Z"
}
```

**Response (200 OK):**
```json
{
  "impact": {
    "affectedBudgets": [
      {
        "id": "cly789def012",
        "name": "Marketing Fevereiro 2026",
        "amount": "10000",
        "spent": 7500.00,
        "remaining": 1000.00,
        "percentUsed": 90.0,
        "isOverBudget": false,
        "category": {
          "id": "clx123abc456",
          "name": "Marketing",
          "type": "EXPENSE"
        }
      }
    ],
    "newAlerts": [
      {
        "budgetId": "cly789def012",
        "budgetName": "Marketing Fevereiro 2026",
        "categoryName": "Marketing",
        "level": "critical",
        "message": "Orçamento 'Marketing Fevereiro 2026' crítico: 90.0% usado...",
        "percentUsed": 90.0,
        "spent": 9000.00,
        "remaining": 1000.00,
        "amount": 10000.00
      }
    ],
    "willExceed": false
  },
  "hasImpact": true,
  "willExceed": false,
  "alertsCount": 1
}
```

**Cenário: Despesa irá estourar orçamento**
```json
{
  "impact": {
    "affectedBudgets": [...],
    "newAlerts": [
      {
        "level": "exceeded",
        "message": "Orçamento 'Marketing Fevereiro 2026' estourado em R$ 500,00!",
        "percentUsed": 105.0,
        "spent": 10500.00,
        "remaining": -500.00
      }
    ],
    "willExceed": true
  },
  "hasImpact": true,
  "willExceed": true,
  "alertsCount": 1
}
```

**Cenário: Nenhum impacto**
```json
{
  "impact": {
    "affectedBudgets": [],
    "newAlerts": [],
    "willExceed": false
  },
  "hasImpact": false,
  "willExceed": false,
  "alertsCount": 0
}
```

**Errors:**
- `400` - Dados inválidos
- `401` - Não autenticado
- `500` - Erro no servidor

---

## 📊 Níveis de Alerta

| Level | Range | Cor | Significado |
|-------|-------|-----|-------------|
| `info` | 0-74% | 🟢 Verde | Uso saudável, tudo ok |
| `warning` | 75-89% | 🟡 Amarelo | Atenção, aproximando do limite |
| `critical` | 90-99% | 🟠 Laranja | Crítico, muito próximo do limite |
| `exceeded` | 100%+ | 🔴 Vermelho | Orçamento estourado |

---

## 🔄 Endpoints Existentes (Sprint 1 & 2)

### GET /api/budgets
Lista todos os orçamentos com informações de uso.

### POST /api/budgets
Cria um novo orçamento.

### GET /api/budgets/[id]
Busca um orçamento específico por ID.

### PUT /api/budgets/[id]
Atualiza um orçamento.

### DELETE /api/budgets/[id]
Deleta um orçamento.

---

## 💡 Casos de Uso

### 1. Dashboard em Tempo Real

```typescript
// Buscar status a cada 30 segundos
setInterval(async () => {
  const response = await fetch('/api/budgets/status');
  const { summary, timestamp } = await response.json();
  
  updateDashboard(summary);
}, 30000);
```

### 2. Notificações Críticas

```typescript
// Buscar apenas alertas críticos
const response = await fetch('/api/budgets/status?onlyCritical=true');
const { alerts, count } = await response.json();

if (count > 0) {
  showNotification(`Você tem ${count} orçamento(s) com problemas!`);
}
```

### 3. Preview ao Criar Despesa

```typescript
// Verificar impacto antes de salvar
async function onAmountChange(categoryId, amount, date) {
  const response = await fetch('/api/budgets/check-impact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categoryId, amount, date })
  });
  
  const { willExceed, newAlerts } = await response.json();
  
  if (willExceed) {
    showWarning('⚠️ Esta despesa irá estourar o orçamento!');
  } else if (newAlerts.length > 0) {
    showInfo(`ℹ️ Esta despesa impactará ${newAlerts.length} orçamento(s)`);
  }
}
```

### 4. Validação Antes de Salvar

```typescript
async function beforeSaveExpense(expense) {
  const { willExceed } = await checkImpact(
    expense.categoryId, 
    expense.amount, 
    expense.date
  );
  
  if (willExceed) {
    const confirm = await askUser(
      'Esta despesa estourará o orçamento. Deseja continuar?'
    );
    
    if (!confirm) return false;
  }
  
  return true;
}
```

---

## 🚀 Exemplos com cURL

### Buscar Status Completo
```bash
curl -X GET http://localhost:3000/api/budgets/status \
  -b "next-auth.session-token=YOUR_TOKEN"
```

### Buscar Apenas Alertas Críticos
```bash
curl -X GET "http://localhost:3000/api/budgets/status?onlyCritical=true" \
  -b "next-auth.session-token=YOUR_TOKEN"
```

### Verificar Impacto de Despesa
```bash
curl -X POST http://localhost:3000/api/budgets/check-impact \
  -H "Content-Type: application/json" \
  -b "next-auth.session-token=YOUR_TOKEN" \
  -d '{
    "categoryId": "clx123abc456",
    "amount": 1500,
    "date": "2026-02-15T00:00:00.000Z"
  }'
```

---

## 🎯 Integrações Recomendadas

### 1. Em Formulários de Despesa
- Use `/check-impact` para preview em tempo real
- Mostre alertas enquanto usuário digita
- Debounce de 500ms para performance

### 2. Em Dashboards
- Use `/status` com auto-refresh (30-60s)
- Mostre métricas agregadas
- Exiba alertas prioritários

### 3. Em Notificações
- Use `/status?onlyCritical=true` para alertas
- Polling a cada 1-2 minutos
- Push notifications quando houver alertas novos

---

## ⚠️ Boas Práticas

### Performance
1. **Debounce**: Aguarde 500ms antes de chamar `/check-impact`
2. **Polling**: Não use intervalos menores que 30s para `/status`
3. **Cache**: Armazene resultados localmente por alguns segundos

### UX
1. **Não bloqueie**: `/check-impact` é informativo, não deve impedir salvamento
2. **Feedback visual**: Use cores semafóricas consistentes
3. **Clareza**: Explique ao usuário o que significa cada alerta

### Segurança
1. **Autenticação**: Todos os endpoints requerem sessão válida
2. **Workspace**: Dados são sempre scopados ao workspace ativo
3. **Validação**: Zod valida todos os inputs

---

## 📈 Métricas de Performance

### Tempos Esperados
- `GET /status`: < 500ms
- `POST /check-impact`: < 300ms
- `GET /status?onlyCritical=true`: < 200ms

### Otimizações
- Queries usam índices no banco
- Agregações feitas no PostgreSQL
- Cálculos em memória são rápidos

---

## 🔮 Próximas Features (Roadmap)

### Sprint 4
- `POST /api/budgets/subscribe` - Inscrever em notificações por email
- `GET /api/budgets/history` - Histórico de alertas
- Webhooks para alertas críticos

### Sprint 5
- `GET /api/budgets/predictions` - Previsões baseadas em histórico
- `GET /api/budgets/trends` - Análise de tendências
- Comparação período a período

---

**Última atualização:** 15 de Fevereiro de 2026  
**Versão da API:** 1.1.0 (Sprint 3)
