# 📚 Guia de Uso - Sistema de Orçamentos

## 🎯 Como funciona o sistema completo

### 1️⃣ **Criar Orçamentos** (`/app/budgets`)

**O que fazer:**
- Clique em "Novo Orçamento"
- Escolha uma categoria (ex: Alimentação)
- Defina o valor máximo (ex: R$ 1.000,00)
- Selecione o período (Mensal ou Personalizado)
- Clique em "Criar"

**Resultado:**
- ✅ Orçamento criado e ativo
- 📊 Aparece na lista de orçamentos
- 🎯 Dashboard mostra status em tempo real

---

### 2️⃣ **Registrar Despesas** (`/app/cashflow`)

**⚠️ IMPORTANTE: Este é o passo crucial!**

Após criar orçamentos, você precisa **registrar despesas** para que o sistema funcione:

1. Vá para `/app/cashflow`
2. Clique em "Nova Despesa"
3. Preencha:
   - **Categoria**: Escolha uma categoria que tem orçamento
   - **Valor**: Digite o valor gasto
   - **Data**: Selecione a data
   - **Descrição**: Opcional
4. Clique em "Criar"

**O que acontece automaticamente:**
- 📈 Orçamento é atualizado em tempo real
- 🔔 Notificações são geradas quando você atinge limites:
  - 75% do orçamento = ⚠️ Alerta amarelo
  - 90% do orçamento = 🔶 Alerta laranja
  - 100% do orçamento = 🔴 Alerta vermelho
  - >110% do orçamento = ⛔ Alerta crítico
- 📊 Estatísticas são calculadas automaticamente

---

### 3️⃣ **Ver Notificações** (`/app/notifications`)

**Quando aparecerão notificações:**
- Somente após registrar despesas que ultrapassem os limites
- Notificações são criadas automaticamente pelo sistema
- Você receberá alertas progressivos (75%, 90%, 100%)

**O que você vê:**
- 📬 Total de notificações
- 👁️ Não lidas (badge no ícone do sino)
- ✅ Lidas
- ❌ Descartadas

**Ações disponíveis:**
- Marcar como lida
- Descartar notificação
- Excluir notificação
- Marcar todas como lidas

---

### 4️⃣ **Gerar Relatórios** (`/app/reports`)

**Como usar:**
1. Selecione o período desejado
   - Use "Mês Atual" se acabou de criar orçamentos
   - Use "Mês Passado" para análise de períodos anteriores
2. Clique em "Gerar Relatório"

**O que o relatório mostra:**
- 📊 Resumo executivo do período
- 💰 Total orçado vs Total gasto
- 📈 Performance geral (% usado)
- 📋 Análise por categoria:
  - ✅ Categorias dentro do orçamento
  - ⚠️ Categorias perto do limite
  - 🔴 Categorias que estouraram
- 💡 Recomendações inteligentes
- 💵 Economia ou excesso por categoria

**Renovação de orçamentos:**
- Após gerar um relatório, você pode clicar em "Renovar Orçamentos"
- Todos os orçamentos mensais serão renovados automaticamente para o próximo período

---

## 🔄 Fluxo Completo de Uso

```
1. Criar Orçamentos (/app/budgets)
        ↓
2. Registrar Despesas (/app/cashflow)  ← PASSO CRUCIAL!
        ↓
3. Ver Notificações (/app/notifications)
        ↓
4. Gerar Relatórios (/app/reports)
        ↓
5. Renovar Orçamentos (se necessário)
```

---

## ❓ FAQ - Perguntas Frequentes

### "Por que não vejo notificações?"
**R:** Notificações são criadas apenas quando você **registra despesas** que ultrapassam os limites dos orçamentos. Criar orçamentos sozinho não gera notificações.

### "Por que o relatório está vazio?"
**R:** 
- Verifique se o período selecionado corresponde ao período dos seus orçamentos
- Se criou orçamentos hoje, use "Mês Atual" no filtro de período
- O relatório só mostra dados de orçamentos e despesas dentro do período selecionado

### "Como o sistema sabe que atingi 75% do orçamento?"
**R:** Quando você registra uma despesa em `/app/cashflow`, o sistema:
1. Calcula automaticamente o total gasto naquela categoria
2. Compara com o valor orçado
3. Gera notificações se ultrapassar 75%, 90% ou 100%

### "Posso ter vários orçamentos na mesma categoria?"
**R:** Não recomendado. O ideal é ter um orçamento por categoria. Se tiver múltiplos orçamentos ativos para a mesma categoria, todos serão considerados nas notificações.

---

## 💡 Dicas de Uso

### 1. **Comece pequeno**
- Crie 3-5 orçamentos nas categorias mais importantes
- Ex: Alimentação, Transporte, Lazer

### 2. **Registre despesas regularmente**
- Quanto mais frequente, mais preciso o acompanhamento
- Registre no mesmo dia ou no dia seguinte

### 3. **Use orçamentos mensais**
- Mais fácil de gerenciar
- Renovação automática disponível

### 4. **Monitore o dashboard**
- Em `/app/budgets`, o dashboard mostra status em tempo real
- Cores indicam saúde dos orçamentos (verde/amarelo/vermelho)

### 5. **Gere relatórios ao fim do mês**
- Compare planejado vs realizado
- Ajuste orçamentos baseado em dados históricos
- Use renovação automática para facilitar

---

## 🎨 Indicadores Visuais

### Cores dos Orçamentos
- 🟢 **Verde**: Gasto < 75% (saudável)
- 🟡 **Amarelo**: Gasto 75-90% (atenção)
- 🟠 **Laranja**: Gasto 90-100% (alerta)
- 🔴 **Vermelho**: Gasto > 100% (estourado)

### Ícones de Notificação
- ⚠️ Warning 75%
- 🔶 Warning 90%
- 🔴 Exceeded 100%
- ⛔ Critical >110%

---

## 📞 Suporte

Se algo não estiver funcionando como esperado:
1. Verifique se você completou o passo 2 (Registrar Despesas)
2. Verifique se o período selecionado está correto
3. Recarregue a página (F5)
4. Verifique o console do navegador (F12) para erros

---

**Criado em**: 16 de Fevereiro de 2026  
**Versão**: 1.0  
**Sistema**: Cashflow Pro
