# 🚧 API em Desenvolvimento

## Status Atual

A feature **API Access** está visível no plano Business, mas **não está funcionalmente ativa**. Ela aparece como "Em desenvolvimento" para clientes Business.

## O que foi implementado

### 1. ✅ Remoção Funcional
- `api_access` removido das features ativas do plano BUSINESS
- Nenhum plano retorna `true` para uso real de API
- Backend bloqueia qualquer tentativa de criar/gerenciar API keys

### 2. ✅ UI "Em Desenvolvimento"
- Página `/app/settings/api` mostra status "Em desenvolvimento"
- Badge "🚧 Em desenvolvimento" visível
- Mensagem transparente: "Estamos construindo uma API poderosa para integrações avançadas. Em breve."
- Botão desabilitado: "Disponível em breve"

### 3. ✅ Bloqueio de Rotas
- Middleware bloqueia `/api/*` (exceto `/api/auth/*`)
- Retorna 403 com mensagem clara
- Rota catch-all `/app/api/[...path]/route.ts` também bloqueia

### 4. ✅ Sidebar
- Link "API" visível para Business
- Badge "Em breve" ao lado do link
- Indica que está no roadmap

### 5. ✅ Tracking
- Evento `api_feature_viewed` disparado quando usuário acessa
- Rastreia interesse na feature

## Como funciona

### Para usuários PRO/FREE
- Veem `FeatureLock` padrão
- Mensagem: "Disponível no plano BUSINESS"

### Para usuários BUSINESS
- Veem página "Em desenvolvimento"
- Badge "🚧 Em desenvolvimento"
- Lista de benefícios futuros
- Botão desabilitado

### Bloqueio Técnico
- Qualquer requisição a `/api/*` (exceto auth) retorna 403
- Mensagem: "API em desenvolvimento"
- Status: `coming_soon`

## Quando ativar

Para ativar a API no futuro:

1. **Atualizar `lib/plans/features.ts`**:
   ```typescript
   BUSINESS: [
     // ...
     "api_access", // Reativar
     // ...
   ]
   ```

2. **Atualizar `lib/plans/feature-status.ts`**:
   ```typescript
   api_access: {
     status: "active", // Mudar de "coming_soon" para "active"
   }
   ```

3. **Remover bloqueios**:
   - Remover middleware de bloqueio
   - Remover rota `/app/api/[...path]/route.ts`
   - Restaurar funcionalidade de criação de keys

4. **Atualizar UI**:
   - Trocar `ApiComingSoon` por `ApiKeysClient`
   - Remover badge "Em breve" da sidebar

## Copy Usado

- **Título**: "API em Desenvolvimento"
- **Mensagem**: "Estamos construindo uma API poderosa para integrações avançadas. Em breve."
- **Badge**: "🚧 Em desenvolvimento"
- **Botão**: "Disponível em breve"

## Resultado

✅ API visível como parte do roadmap  
✅ Nenhuma funcionalidade ativa  
✅ Nenhum risco técnico  
✅ UX elegante e honesta  
✅ Percepção de produto em evolução  

