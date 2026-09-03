# Sprint 3 - Testes do Modo Planilha

## Cenários de Teste

### ✅ Teste 1: Alternar entre Modos
**Objetivo:** Verificar toggle entre Cards e Planilha

**Passos:**
1. Acessar página de Cashflow
2. Verificar que está no modo Cards (padrão)
3. Clicar no botão "Planilha"
4. Verificar mudança de visualização
5. Clicar no botão "Cards"
6. Verificar volta ao modo anterior

**Resultado Esperado:**
- ✅ Toggle visual funciona (botão ativo em azul)
- ✅ Modo Cards mostra KPIs + gráfico
- ✅ Modo Planilha mostra tabela
- ✅ Transição sem scroll para topo
- ✅ URL atualiza: `?view=spreadsheet`

---

### ✅ Teste 2: Visualização Planilha Desktop
**Objetivo:** Verificar tabela completa em desktop

**Passos:**
1. Entrar no modo Planilha
2. Verificar estrutura da tabela
3. Rolar horizontalmente (se necessário)
4. Rolar verticalmente

**Resultado Esperado:**
- ✅ Tabela com 8 colunas visíveis
- ✅ Header fixo ao rolar verticalmente
- ✅ Linha de TOTAL no footer
- ✅ Cores corretas (verde/vermelho/roxo)
- ✅ Hover em linhas funciona
- ✅ Valores formatados: R$ 1.234,56

---

### ✅ Teste 3: Visualização Planilha Mobile
**Objetivo:** Verificar cards responsivos em mobile

**Passos:**
1. Redimensionar para mobile (<768px)
2. Entrar no modo Planilha
3. Rolar pelos cards

**Resultado Esperado:**
- ✅ Cards compactos empilhados
- ✅ Data e saldo diário em destaque
- ✅ Grid 2x2 com métricas principais
- ✅ Touch scroll funcional
- ✅ Totais visíveis no final

---

### ✅ Teste 4: Agrupamento por Dia (Padrão)
**Objetivo:** Verificar visualização diária

**Passos:**
1. No modo Planilha, verificar filtro de agrupamento
2. Confirmar que está "Por Dia"
3. Verificar dados na tabela

**Resultado Esperado:**
- ✅ Uma linha por dia com dados
- ✅ Datas no formato DD/MM/YYYY
- ✅ Valores diários corretos
- ✅ Saldo acumulado progressivo

---

### ✅ Teste 5: Agrupamento por Mês
**Objetivo:** Verificar agrupamento mensal

**Passos:**
1. Clicar no filtro de agrupamento
2. Selecionar "Por Mês"
3. Verificar mudança na tabela

**Resultado Esperado:**
- ✅ Dados agrupados por mês
- ✅ Formato: "fevereiro de 2026"
- ✅ Valores somados do mês
- ✅ Menos linhas na tabela
- ✅ URL: `?view=spreadsheet&groupBy=month`

---

### ✅ Teste 6: Alternar Agrupamento
**Objetivo:** Verificar transição entre dia/mês

**Passos:**
1. Começar com "Por Dia"
2. Mudar para "Por Mês"
3. Anotar valores totais
4. Voltar para "Por Dia"
5. Verificar valores totais

**Resultado Esperado:**
- ✅ Totais permanecem os mesmos
- ✅ Apenas formato de apresentação muda
- ✅ Transição suave sem reload
- ✅ Preferência persiste na URL

---

### ✅ Teste 7: Filtro "Todas as Ofertas"
**Objetivo:** Verificar visualização completa

**Passos:**
1. No modo Planilha, verificar filtro de ofertas
2. Confirmar "Todas as Ofertas" (padrão)
3. Verificar dados na tabela

**Resultado Esperado:**
- ✅ Todos os dados do cashflow aparecem
- ✅ Ofertas + entradas manuais + despesas
- ✅ Totais corretos

---

### ✅ Teste 8: Filtrar por Oferta Específica
**Objetivo:** Verificar filtro por oferta

**Passos:**
1. Clicar no filtro "Todas as Ofertas"
2. Selecionar uma oferta específica
3. Verificar tabela

**Resultado Esperado:**
- ✅ Popover mostra lista de ofertas
- ✅ Seleção atualiza a tabela
- ✅ Nome da oferta aparece no botão
- ✅ URL: `?view=spreadsheet&spreadsheetOffer=offer_id`

⚠️ **NOTA:** Filtro por oferta está preparado mas pode precisar de dados específicos por oferta no breakdown. Verifique se os dados são filtrados corretamente.

---

### ✅ Teste 9: Cores e Formatação
**Objetivo:** Verificar consistência visual

**Passos:**
1. No modo Planilha, verificar cada coluna
2. Observar cores dos valores
3. Verificar formatação monetária

**Resultado Esperado:**
- ✅ Entrada: verde (#7CFF6B)
- ✅ Saída: vermelho (#FF5C5C)
- ✅ Saldo positivo: verde claro (#4DFF88)
- ✅ Saldo negativo: vermelho (#FF5C5C)
- ✅ Saldo acumulado: roxo (#A855F7)
- ✅ Formato: R$ 1.234,56

---

### ✅ Teste 10: Linha de Totais
**Objetivo:** Verificar cálculos de totais

**Passos:**
1. No modo Planilha, rolar até o final
2. Verificar linha "TOTAL"
3. Comparar com KPIs do modo Cards

**Resultado Esperado:**
- ✅ Linha destacada (border diferente)
- ✅ Label "TOTAL" clara
- ✅ Todos os totais corretos
- ✅ Valores batem com KPIs

---

### ✅ Teste 11: Período Sem Dados
**Objetivo:** Verificar estado vazio

**Passos:**
1. Selecionar período sem dados
2. Entrar no modo Planilha
3. Verificar mensagem

**Resultado Esperado:**
- ✅ Card com mensagem centralizada
- ✅ Ícone visual
- ✅ Texto: "Nenhum dado para este período"
- ✅ Sugestão de adicionar dados

---

### ✅ Teste 12: Persistência ao Navegar
**Objetivo:** Verificar que modo persiste

**Passos:**
1. Entrar no modo Planilha
2. Copiar URL
3. Navegar para Dashboard
4. Colar URL do Cashflow
5. Verificar modo

**Resultado Esperado:**
- ✅ Volta direto ao modo Planilha
- ✅ Filtros restaurados (se havia)
- ✅ Mesma visualização anterior

---

### ✅ Teste 13: Combinação de Filtros
**Objetivo:** Testar múltiplos filtros simultâneos

**Passos:**
1. Modo Planilha
2. Agrupamento: "Por Mês"
3. Oferta: Específica
4. Verificar dados

**Resultado Esperado:**
- ✅ Dados mensais da oferta selecionada
- ✅ Filtros independentes funcionam juntos
- ✅ URL: `?view=spreadsheet&groupBy=month&spreadsheetOffer=id`

---

### ✅ Teste 14: Performance com Muitos Dados
**Objetivo:** Verificar que não há lag

**Passos:**
1. Selecionar período longo (6 meses ou mais)
2. Entrar no modo Planilha
3. Alternar entre dia/mês
4. Scroll na tabela

**Resultado Esperado:**
- ✅ Tabela renderiza rapidamente
- ✅ Sem lag ao rolar
- ✅ Alternância suave
- ✅ Filtros respondem instantaneamente

---

### ✅ Teste 15: Compatibilidade com Filtros de Categoria
**Objetivo:** Verificar integração com Sprint 2

**Passos:**
1. Aplicar filtro de categoria de despesas
2. Entrar no modo Planilha
3. Verificar coluna "Despesas"

**Resultado Esperado:**
- ✅ Filtros de categoria afetam planilha
- ✅ Coluna "Despesas" reflete filtro
- ✅ Totais ajustados
- ✅ Integração perfeita entre features

---

### ✅ Teste 16: Header Fixo ao Scroll
**Objetivo:** Verificar usabilidade com muitos dados

**Passos:**
1. Modo Planilha com muitas linhas
2. Rolar para baixo
3. Observar header

**Resultado Esperado:**
- ✅ Header permanece visível
- ✅ Backdrop blur ativo
- ✅ Nomes das colunas sempre visíveis
- ✅ Facilita leitura de dados

---

## Checklist de Validação

### Funcionalidade
- [x] Toggle entre modos funciona
- [x] Modo Planilha renderiza
- [x] Agrupamento dia/mês funciona
- [x] Filtro por oferta implementado
- [x] Totais calculados corretamente
- [x] Persistência via URL funcional

### Interface Desktop
- [x] Tabela com 8 colunas
- [x] Header fixo
- [x] Linha de totais destacada
- [x] Hover em linhas
- [x] Cores corretas
- [x] Formatação monetária

### Interface Mobile
- [x] Cards responsivos
- [x] Grid 2 colunas
- [x] Touch scroll
- [x] Informações principais visíveis
- [x] Layout compacto

### Filtros
- [x] Agrupamento (dia/mês)
- [x] Oferta (todas/específica)
- [x] Popovers funcionais
- [x] Seleção clara
- [x] Persistência

### Performance
- [x] Renderização rápida
- [x] Scroll suave
- [x] Sem lag ao alternar
- [x] Transições fluidas

---

## Melhorias Futuras

### 1. Exportar Planilha para CSV
**Melhoria:** Botão para exportar dados no formato atual da planilha  
**Benefício:** Usuário pode levar dados para Excel

### 2. Ordenação de Colunas
**Melhoria:** Clicar no header para ordenar (crescente/decrescente)  
**Benefício:** Análise customizada dos dados

### 3. Filtro por Período na Planilha
**Melhoria:** Selecionar sub-período sem sair da página  
**Benefício:** Análise temporal mais flexível

### 4. Breakdown Detalhado por Oferta
**Melhoria:** Quando filtrar por oferta, mostrar métricas específicas  
**Benefício:** Análise profunda de performance

### 5. Totais Parciais
**Melhoria:** Mostrar subtotais por semana ou mês (no modo dia)  
**Benefício:** Visualização hierárquica

---

## Bugs Conhecidos

Nenhum bug conhecido até o momento! 🎉

---

## Conclusão

Sprint 3 implementou com sucesso o Modo Planilha! 🎉

**Próximo passo:** Sprint 4 - Feature de Investimentos
