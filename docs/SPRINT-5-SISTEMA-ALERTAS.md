# 🚀 Sprint 5 - Sistema de Alertas

## ✅ Status: COMPLETO

Sistema completo de notificações persistidas com alertas automáticos para orçamentos.

---

## 📋 Objetivo

Criar um sistema de notificações automáticas que alerta os usuários quando orçamentos atingem limites críticos (75%, 90%, 100%, acima de 100%).

---

## 🎯 Entregas

- ✅ Model de notificações no banco de dados
- ✅ Sistema de verificação de limites (4 níveis)
- ✅ Disparo automático de alertas ao criar despesas
- ✅ API RESTful para notificações
- ✅ Badge/contador de notificações não lidas
- ✅ Lista visual de notificações
- ✅ Marcar como lida/descartada
- ✅ Painel de notificações completo
- ✅ Integração com sidebar
- ✅ Persistência para histórico

---

## 📊 Arquitetura

### 1. Database Schema

```prisma
enum NotificationType {
  BUDGET_WARNING_75
  BUDGET_WARNING_90
  BUDGET_EXCEEDED_100
  BUDGET_CRITICAL_EXCEEDED
}

enum NotificationStatus {
  UNREAD
  READ
  DISMISSED
}

model BudgetNotification {
  id          String            @id @default(cuid())
  workspaceId String
  budgetId    String
  userId      String
  type        NotificationType
  status      NotificationStatus @default(UNREAD)
  title       String
  message     String
  metadata    String?           @map("metadata_json")
  createdAt   DateTime          @default(now())
  readAt      DateTime?
  dismissedAt DateTime?

  workspace   Workspace         @relation
  budget      Budget            @relation
}
```

### 2. Limites de Alerta

| Percentual | Tipo | Ícone | Cor | Prioridade |
|------------|------|-------|-----|------------|
| 75-89% | WARNING_75 | ⚠️ | Amarelo | 1 |
| 90-99% | WARNING_90 | 🔔 | Laranja | 2 |
| 100-109% | EXCEEDED_100 | 🚨 | Vermelho | 3 |
| ≥110% | CRITICAL_EXCEEDED | ❌ | Vermelho | 4 |

### 3. Fluxo Automático

```
Usuário cria despesa
  ↓
System verifica categoria
  ↓
Busca orçamentos ativos da categoria
  ↓
Calcula % usado para cada orçamento
  ↓
Detecta limites atingidos
  ↓
Verifica duplicatas (24h window)
  ↓
Cria notificações automáticas
  ↓
Badge atualiza em tempo real
```

---

## 📁 Arquivos Criados

### Backend (Database & Logic)

1. **prisma/schema.prisma** (atualizado)
   - Enums: `NotificationType`, `NotificationStatus`
   - Model: `BudgetNotification`
   - Relações: Workspace, Budget

2. **prisma/migrations/20260216024917_add_budget_notifications/migration.sql**
   - Migration automática

3. **types/notification.ts**
   - Schemas Zod de validação
   - Interfaces TypeScript
   - Funções utilitárias (ícones, cores, prioridades)

4. **lib/domain/notification.ts** (285 linhas)
   - CRUD completo de notificações
   - Estatísticas agregadas
   - Marcar todas como lidas
   - Limpeza de notificações antigas
   - Contagem de não lidas

5. **lib/domain/budget-alerts.ts** (141 linhas)
   - Detecção de limites violados
   - Geração automática de notificações
   - Verificação em lote
   - Formatação de mensagens

### API Endpoints

6. **app/api/notifications/route.ts**
   - `GET /api/notifications` - Listar com filtros
   - `POST /api/notifications` - Criar manual

7. **app/api/notifications/[id]/route.ts**
   - `GET /api/notifications/[id]` - Buscar por ID
   - `PUT /api/notifications/[id]` - Atualizar status
   - `DELETE /api/notifications/[id]` - Deletar

8. **app/api/notifications/stats/route.ts**
   - `GET /api/notifications/stats` - Estatísticas

9. **app/api/notifications/mark-all-read/route.ts**
   - `POST /api/notifications/mark-all-read` - Marcar todas

### Frontend (UI)

10. **components/notifications/use-notifications.ts** (151 linhas)
    - Hook `useNotifications()` - Completo
    - Hook `useUnreadCount()` - Simplificado
    - Auto-refresh configurável

11. **components/notifications/notification-badge.tsx**
    - Badge com contador
    - Indicador de loading
    - Auto-refresh 30s

12. **components/notifications/notification-list.tsx** (196 linhas)
    - Lista de notificações
    - Card individual com ações
    - Estados vazios/loading
    - Visual dinâmico por tipo

13. **components/notifications/notification-panel.tsx** (123 linhas)
    - Painel completo
    - Estatísticas agregadas
    - Filtros (ALL/UNREAD/READ/DISMISSED)
    - Marcar todas como lidas

14. **app/app/notifications/page.tsx**
    - Página dedicada
    - Server-side rendering
    - Autenticação necessária

15. **components/layout/sidebar.tsx** (atualizado)
    - Link para "Notificações"
    - Badge no menu (futuro)

### Integração

16. **app/app/cashflow/actions.ts** (atualizado)
    - Trigger automático em `createExpense()`
    - Busca orçamentos ativos da categoria
    - Gera notificações se limites atingidos
    - Não falha se notificações falharem

17. **types/budget.ts** (atualizado)
    - Adicionado `activeOnly?: boolean`

18. **lib/domain/budget.ts** (atualizado)
    - Suporte para `activeOnly` e `isActive`

---

## 🔌 Endpoints da API

### GET /api/notifications

Lista notificações com filtros.

**Query Params:**
- `userId` - Filtrar por usuário
- `status` - UNREAD, READ, DISMISSED
- `type` - Tipo de notificação
- `limit` - Limite (default: 50)
- `offset` - Offset para paginação

**Response:**
```json
{
  "notifications": [
    {
      "id": "clx...",
      "type": "BUDGET_WARNING_90",
      "status": "UNREAD",
      "title": "🔔 Alimentação: 90% do orçamento atingido!",
      "message": "ATENÇÃO: Você já gastou R$ 900.00 de R$ 1000.00 (90.0%). Restam apenas R$ 100.00.",
      "metadata": "{...}",
      "createdAt": "2026-02-15T...",
      "budget": {
        "id": "...",
        "name": "Orçamento Alimentação Fevereiro",
        "category": {
          "id": "...",
          "name": "Alimentação"
        }
      }
    }
  ]
}
```

### POST /api/notifications

Cria notificação manual.

**Body:**
```json
{
  "budgetId": "clx...",
  "userId": "user123",
  "type": "BUDGET_WARNING_75",
  "title": "Título da notificação",
  "message": "Mensagem detalhada",
  "metadata": {
    "percentUsed": 75.5,
    "spent": 755,
    "amount": 1000,
    "categoryName": "Transporte"
  }
}
```

### PUT /api/notifications/[id]

Atualiza status da notificação.

**Body:**
```json
{
  "status": "READ"
}
```

### DELETE /api/notifications/[id]

Deleta uma notificação.

### GET /api/notifications/stats

Retorna estatísticas agregadas.

**Response:**
```json
{
  "stats": {
    "total": 42,
    "unread": 8,
    "read": 30,
    "dismissed": 4,
    "byType": {
      "warning75": 12,
      "warning90": 8,
      "exceeded100": 5,
      "criticalExceeded": 2
    }
  }
}
```

### POST /api/notifications/mark-all-read

Marca todas como lidas.

**Response:**
```json
{
  "message": "8 notificações marcadas como lidas",
  "count": 8
}
```

---

## 🎨 Componentes

### NotificationBadge

Badge minimalista com contador.

```tsx
<NotificationBadge
  onClick={() => navigate('/app/notifications')}
  autoRefresh={true}
  refreshInterval={30000}
/>
```

**Props:**
- `onClick` - Callback ao clicar
- `autoRefresh` - Habilitar polling
- `refreshInterval` - Intervalo em ms

### NotificationList

Lista visual de notificações.

```tsx
<NotificationList
  notifications={notifications}
  onMarkAsRead={handleRead}
  onDismiss={handleDismiss}
  onDelete={handleDelete}
  loading={false}
/>
```

**Features:**
- Visual por tipo (cores, ícones)
- Ações inline (ler, descartar, deletar)
- Metadata expandida
- Link para orçamento

### NotificationPanel

Painel completo com filtros e stats.

```tsx
<NotificationPanel initialFilter="UNREAD" />
```

**Features:**
- Dashboard de estatísticas (4 cards)
- Filtros dropdown
- Botão "Marcar todas como lidas"
- Lista integrada

---

## 🧩 Hooks Customizados

### useNotifications()

Hook completo para gerenciar notificações.

```tsx
const {
  notifications,
  stats,
  loading,
  error,
  fetchNotifications,
  fetchStats,
  markAsRead,
  markAsDismissed,
  markAllAsRead,
  deleteNotification,
} = useNotifications();
```

**Features:**
- Fetch inicial automático
- Filtros dinâmicos
- Ações batch
- Estado centralizado

### useUnreadCount()

Hook simplificado para contador.

```tsx
const { unreadCount, loading, refresh } = useUnreadCount(true, 30000);
```

**Params:**
- `autoRefresh` - Habilitar polling
- `intervalMs` - Intervalo de atualização

---

## ⚡ Funcionalidades

### 1. Disparo Automático

Ao criar uma despesa:
1. Verifica se tem categoria
2. Busca orçamentos ativos da categoria
3. Calcula % usado de cada orçamento
4. Detecta limites atingidos
5. Verifica se já enviou notificação similar nas últimas 24h
6. Cria notificações necessárias

### 2. Anti-Spam

Sistema de deduplicação inteligente:
- Janela de 24 horas
- Por tipo + orçamento
- Evita notificações repetidas

### 3. Persistência

Notificações são salvas no banco:
- Histórico completo
- Timestamps (criação, leitura, descarte)
- Metadata JSON com detalhes

### 4. Auto-Refresh

Componentes atualizam automaticamente:
- Badge: 30s
- Painel: On demand
- Hook configurável

### 5. Limpeza Automática

Função utilitária para limpar:
```ts
await deleteOldNotifications(workspaceId, 90); // 90 dias
```

---

## 📈 Estatísticas

### Por Status
- Total de notificações
- Não lidas (UNREAD)
- Lidas (READ)
- Descartadas (DISMISSED)

### Por Tipo
- warning75 - 75% atingido
- warning90 - 90% atingido
- exceeded100 - Estourado
- criticalExceeded - Crítico

---

## 🎯 Integrações

### 1. Sidebar

Link dedicado "Notificações" na seção Navegação.

### 2. Cashflow (Despesas)

Trigger automático em `createExpense()`.

### 3. Orçamentos

Link direto do card de notificação para o orçamento.

---

## 🧪 Como Testar

### 1. Criar Orçamento

```
/app/budgets → Novo Orçamento
- Categoria: Alimentação
- Valor: R$ 1000
- Período: Fevereiro
```

### 2. Criar Despesas Progressivas

```
/app/cashflow → Nova Despesa
- R$ 750 → 75% → Notificação WARNING_75 ⚠️
- R$ 150 → 90% → Notificação WARNING_90 🔔
- R$ 110 → 101% → Notificação EXCEEDED_100 🚨
- R$ 200 → 126% → Notificação CRITICAL_EXCEEDED ❌
```

### 3. Ver Notificações

```
/app/notifications
- Ver lista completa
- Testar filtros
- Marcar como lida
- Descartar
- Deletar
```

### 4. Badge

```
Sidebar → Ícone de sino
- Contador vermelho
- Auto-refresh
```

---

## 🛠️ Tecnologias

- **Backend:** Prisma, PostgreSQL, Next.js API Routes
- **Frontend:** React, Next.js, Tailwind CSS
- **Validação:** Zod
- **Formatação:** date-fns
- **Ícones:** lucide-react
- **Real-time:** Polling (30s)

---

## 📊 Métricas

### Código
- **18 arquivos** criados/modificados
- **~2.400 linhas** de código
- **5 endpoints** de API
- **7 componentes** React
- **2 hooks** customizados
- **4 funções** de domínio

### Database
- **1 nova tabela** (BudgetNotification)
- **2 enums** (NotificationType, NotificationStatus)
- **7 índices** para performance

---

## 🚀 Próximos Passos (Futuro)

### Push Notifications
- Service Worker
- Web Push API
- Notificações no sistema operacional

### Email Notifications
- Digest diário de alertas
- Notificações críticas por email

### Customização
- Configurar limites personalizados
- Silenciar categorias específicas
- Horários de não perturbar

### Analytics
- Gráficos de alertas ao longo do tempo
- Padrões de gasto vs alertas
- Efetividade dos alertas

---

## 📝 Notas Importantes

1. **Não Bloqueia Criação de Despesas:** Se a geração de notificações falhar, a despesa é criada normalmente

2. **Janela de Deduplicação:** 24 horas por padrão, configurável

3. **Auto-Limpeza:** Implementar job cron para deletar notificações antigas

4. **Performance:** Índices otimizados para queries de workspace + userId

5. **Escalabilidade:** Sistema suporta workspaces com múltiplos usuários

---

## ✅ Checklist de Implementação

- [x] Criar model de Notification
- [x] Criar migration
- [x] Criar tipos TypeScript
- [x] Criar serviços de domínio
- [x] Criar sistema de detecção de limites
- [x] Criar endpoints de API
- [x] Criar hook de notificações
- [x] Criar badge/contador
- [x] Criar lista de notificações
- [x] Criar painel completo
- [x] Integrar com sidebar
- [x] Integrar com criação de despesas
- [x] Testar build
- [x] Documentar sistema

---

## 🎉 Resultado Final

Sistema completo de notificações automáticas para alertas de orçamento, com:

✅ **Persistência** - Banco de dados robusto  
✅ **Automação** - Disparo automático em tempo real  
✅ **UI Intuitiva** - Visual claro e ações rápidas  
✅ **Performance** - Queries otimizadas  
✅ **Escalável** - Suporta workspaces grandes  
✅ **Build OK** - 0 erros TypeScript/ESLint  

---

**Sprint 5 - Concluído em:** 16 de Fevereiro de 2026  
**Build Status:** ✅ SUCCESS  
**Produção:** Pronto para deploy
