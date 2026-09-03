# 🔔 Guia Rápido - Sistema de Alertas de Orçamentos

## 📌 O que é?

Sistema automático que te avisa quando você está gastando demais em uma categoria que tem orçamento definido.

---

## 🎯 Como funciona?

### Automático
Toda vez que você cria uma despesa, o sistema:
1. Verifica se a categoria tem orçamento ativo
2. Calcula quanto % você já gastou
3. Se atingir 75%, 90%, 100% ou mais: **cria uma notificação**

### Em Tempo Real
- Badge no sidebar mostra quantas notificações não lidas
- Auto-atualiza a cada 30 segundos
- Não precisa recarregar a página

---

## 🚨 Níveis de Alerta

| % Gasto | Tipo | Visual | Quando Aparece |
|---------|------|--------|----------------|
| **75-89%** | ⚠️ Atenção | 🟡 Amarelo | Você está usando 3/4 do orçamento |
| **90-99%** | 🔔 Crítico | 🟠 Laranja | Quase no limite! |
| **100-109%** | 🚨 Excedido | 🔴 Vermelho | Você estourou o orçamento |
| **≥110%** | ❌ Muito Crítico | 🔴 Vermelho | Muito acima do limite |

---

## 📱 Onde Ver?

### 1. Badge no Sidebar
- Ícone de sino (🔔) no menu lateral
- Número vermelho mostra quantas não lidas
- Clique para ir para a página de notificações

### 2. Página de Notificações
**Acesso:** `/app/notifications` ou clique no badge

**O que tem:**
- 📊 Cards com estatísticas (Total, Não lidas, Lidas, Descartadas)
- 🔍 Filtro: Todas / Não lidas / Lidas / Descartadas
- ✅ Botão "Marcar todas como lidas"
- 📋 Lista completa de notificações

---

## 🎨 Card de Notificação

Cada notificação mostra:
- **Ícone e cor** por tipo de alerta
- **Título** descritivo
- **Mensagem** com valores exatos
- **Metadata:** Categoria, % usado, R$ gasto / previsto
- **Ações rápidas:**
  - ✅ Marcar como lida
  - ❌ Descartar
  - 🗑️ Deletar
- **Link** para o orçamento

---

## ⚙️ Ações Disponíveis

### Marcar como Lida ✅
- Remove do contador de "não lidas"
- Fica mais transparente na lista
- Atalho: botão ✓ no card

### Descartar ❌
- Marca como "descartada"
- Remove do contador
- Fica oculta por padrão

### Deletar 🗑️
- Remove permanentemente
- Não pode desfazer

### Marcar Todas como Lidas
- Botão no topo da página
- Marca todas as não lidas de uma vez

---

## 📊 Filtros

**Dropdown no topo:**
- **Todas** - Todas as notificações
- **Não lidas** - Apenas as novas
- **Lidas** - Já visualizadas
- **Descartadas** - Ignoradas

---

## 🔁 Auto-Atualização

### Badge
Atualiza sozinho a cada **30 segundos**

### Página
Atualiza ao fazer ações (marcar lida, etc)

---

## 💡 Exemplo Prático

### Cenário:
Você criou um orçamento:
- **Categoria:** Alimentação
- **Valor:** R$ 1.000,00
- **Período:** Fevereiro/2026

### Gastando ao longo do mês:

#### Semana 1: R$ 200
✅ Tudo ok, ainda está em 20%

#### Semana 2: R$ 550 (total R$ 750)
⚠️ **ALERTA 1:** "75% do orçamento atingido"
- Badge: 🔴 1
- Cor: Amarelo

#### Semana 3: R$ 150 (total R$ 900)
🔔 **ALERTA 2:** "90% do orçamento atingido!"
- Badge: 🔴 2
- Cor: Laranja
- Mensagem: "Restam apenas R$ 100"

#### Fim do mês: R$ 110 (total R$ 1.010)
🚨 **ALERTA 3:** "Orçamento EXCEDIDO!"
- Badge: 🔴 3
- Cor: Vermelho
- Mensagem: "Você está R$ 10,00 acima do limite"

#### Extras: R$ 300 (total R$ 1.310)
❌ **ALERTA 4:** "ORÇAMENTO CRÍTICO!"
- Badge: 🔴 4
- Cor: Vermelho
- Mensagem: "131% usado. Ação imediata necessária!"

---

## 🛡️ Proteções

### Anti-Spam
- Não envia alerta duplicado do mesmo tipo
- Janela de 24 horas por orçamento
- Exemplo: Se já enviou "75%" hoje, não envia de novo

### Não Bloqueia Despesas
- Mesmo se houver erro nas notificações
- Suas despesas são salvas normalmente
- Notificações são "bonus", não obrigatórias

---

## 📌 Dicas de Uso

### 1. Configure Orçamentos
Vá em `/app/budgets` e crie orçamentos para suas categorias principais.

### 2. Monitore Regularmente
Acesse a página de notificações semanalmente.

### 3. Use os Filtros
Foque nas "Não lidas" para ver novidades.

### 4. Aja Rápido
Quando ver alerta de 90%, ainda dá tempo de ajustar.

### 5. Marque como Lida
Mantém tudo organizado e o contador limpo.

---

## ❓ Perguntas Frequentes

### Posso desabilitar notificações?
Não no momento. Futuras versões terão configurações.

### Quanto tempo ficam salvas?
Para sempre, mas você pode deletar manualmente.

### Funciona para todos os usuários do workspace?
Sim, cada usuário vê suas próprias notificações.

### E se eu editar uma despesa?
Não gera nova notificação. Apenas criação dispara alertas.

### Posso mudar os limites (75%, 90%)?
Não no momento. Futuras versões terão personalização.

---

## 🎯 Resumo

✅ **Automático** - Sem configuração  
✅ **Inteligente** - 4 níveis de alerta  
✅ **Visual** - Cores e ícones claros  
✅ **Rápido** - Ações inline  
✅ **Histórico** - Tudo salvo  

---

**Acesse agora:** [/app/notifications](/app/notifications)

**Documentação Técnica:** `docs/SPRINT-5-SISTEMA-ALERTAS.md`
