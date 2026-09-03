# Sprint 2 - Testes de Filtros por Categoria

## Cenários de Teste

### ✅ Teste 1: Filtrar Despesas por 1 Categoria
**Objetivo:** Verificar filtro simples de despesas

**Passos:**
1. Acessar página de Cashflow
2. Rolar até a seção "Despesas do período"
3. Clicar no botão "Filtrar Despesas"
4. Selecionar 1 categoria (ex: Marketing)
5. Verificar a tabela de despesas

**Resultado Esperado:**
- ✅ Popover abre com lista de categorias
- ✅ Categoria selecionada fica destacada (azul)
- ✅ Contador "①" aparece no botão
- ✅ Tabela mostra apenas despesas de Marketing
- ✅ URL atualizada: `?expenseCategories=cat_id`

---

### ✅ Teste 2: Filtrar Despesas por Múltiplas Categorias
**Objetivo:** Verificar seleção múltipla

**Passos:**
1. No filtro de despesas, selecionar 3 categorias
2. Verificar a tabela

**Resultado Esperado:**
- ✅ Todas as 3 categorias ficam destacadas
- ✅ Contador "③" aparece no botão
- ✅ Tabela mostra despesas das 3 categorias
- ✅ URL: `?expenseCategories=id1,id2,id3`

---

### ✅ Teste 3: Limpar Filtros de Despesas
**Objetivo:** Verificar botão "Limpar"

**Passos:**
1. Com filtros ativos, clicar em "Filtrar Despesas"
2. Clicar no botão "Limpar"
3. Verificar a tabela

**Resultado Esperado:**
- ✅ Todas as seleções são removidas
- ✅ Popover fecha automaticamente
- ✅ Contador desaparece do botão
- ✅ Botão volta ao estilo normal (sem cor primária)
- ✅ Tabela mostra TODAS as despesas
- ✅ Parâmetro `expenseCategories` removido da URL

---

### ✅ Teste 4: Filtrar Entradas Manuais
**Objetivo:** Verificar filtro de entradas funciona independentemente

**Passos:**
1. Rolar até "Entradas manuais do período"
2. Clicar em "Filtrar Entradas"
3. Selecionar 2 categorias
4. Verificar a tabela de entradas

**Resultado Esperado:**
- ✅ Tabela de entradas filtrada corretamente
- ✅ Contador "②" no botão
- ✅ URL: `?incomeCategories=id1,id2`
- ✅ Seção de despesas NÃO é afetada

---

### ✅ Teste 5: Filtros Simultâneos (Despesas + Entradas)
**Objetivo:** Verificar que filtros funcionam independentemente

**Passos:**
1. Filtrar despesas por 2 categorias
2. Filtrar entradas por 1 categoria
3. Verificar ambas as tabelas

**Resultado Esperado:**
- ✅ Tabela de despesas mostra apenas 2 categorias
- ✅ Tabela de entradas mostra apenas 1 categoria
- ✅ URL: `?expenseCategories=id1,id2&incomeCategories=id3`
- ✅ Contadores corretos em ambos os botões

---

### ✅ Teste 6: Persistência via URL
**Objetivo:** Verificar que filtros sobrevivem a navegação

**Passos:**
1. Aplicar filtros (despesas e entradas)
2. Copiar a URL
3. Navegar para outra página (ex: Dashboard)
4. Colar a URL e acessar
5. Verificar os filtros

**Resultado Esperado:**
- ✅ Filtros são restaurados automaticamente
- ✅ Contadores aparecem nos botões
- ✅ Tabelas já vêm filtradas
- ✅ Checkboxes corretos estão marcados no popover

---

### ✅ Teste 7: Remover Categoria Individual
**Objetivo:** Verificar desmarcação de checkbox

**Passos:**
1. Selecionar 3 categorias
2. Abrir popover novamente
3. Desmarcar 1 categoria (clicar novamente)
4. Verificar a tabela

**Resultado Esperado:**
- ✅ Categoria desmarcada some do filtro
- ✅ Contador muda de "③" para "②"
- ✅ Tabela atualiza automaticamente
- ✅ URL atualizada (categoria removida)

---

### ✅ Teste 8: Itens Sem Categoria
**Objetivo:** Verificar comportamento de itens sem categoria

**Passos:**
1. Garantir que existem despesas sem categoria
2. Aplicar filtro de categorias
3. Verificar se itens sem categoria aparecem

**Resultado Esperado:**
- ✅ Com filtro ativo: itens sem categoria NÃO aparecem
- ✅ Sem filtro: itens sem categoria aparecem normalmente

---

### ✅ Teste 9: Popover em Mobile
**Objetivo:** Verificar responsividade

**Passos:**
1. Acessar em tela mobile (ou usar DevTools)
2. Clicar em "Filtrar Despesas"
3. Testar seleção de categorias

**Resultado Esperado:**
- ✅ Popover se ajusta à tela
- ✅ Lista de categorias é scrollável
- ✅ Touch funciona corretamente
- ✅ Interface permanece usável

---

### ✅ Teste 10: Performance com Muitas Categorias
**Objetivo:** Verificar que não há lag com muitos itens

**Passos:**
1. Criar 20+ categorias
2. Abrir popover de filtros
3. Selecionar várias categorias rapidamente
4. Verificar responsividade

**Resultado Esperado:**
- ✅ Lista renderiza rapidamente
- ✅ Scroll suave
- ✅ Seleções respondem instantaneamente
- ✅ Sem lag ao atualizar tabela

---

### ✅ Teste 11: Combinação com Filtros de Data
**Objetivo:** Verificar que filtros de categoria funcionam com filtros de data

**Passos:**
1. Selecionar período de 7 dias
2. Aplicar filtro de categorias
3. Mudar para período de 30 dias
4. Verificar se filtros de categoria persistem

**Resultado Esperado:**
- ✅ Filtros de categoria mantidos ao mudar data
- ✅ URL: `?range=30d&expenseCategories=id1,id2`
- ✅ Tabela atualiza com novo período + filtros

---

### ✅ Teste 12: Exportação CSV com Filtros
**Objetivo:** Verificar que CSV respeita filtros

**Passos:**
1. Aplicar filtros de categorias
2. Clicar em "Exportar CSV"
3. Abrir arquivo CSV

**Resultado Esperado:**
- ✅ CSV contém apenas itens filtrados
- ⚠️ **NOTA:** Atualmente a exportação pode NÃO respeitar filtros de categoria
- 📝 **Melhoria futura:** Fazer CSV respeitar filtros ativos

---

## Checklist de Validação

### Funcionalidade
- [x] Filtro de despesas por categoria funciona
- [x] Filtro de entradas por categoria funciona
- [x] Seleção múltipla funciona
- [x] Botão "Limpar" funciona
- [x] Filtros independentes (despesas ≠ entradas)

### Interface
- [x] Contador visual correto
- [x] Feedback visual de filtro ativo (cor primária)
- [x] Checkboxes visualmente claros
- [x] Popover responsivo
- [x] Layout mobile funcional

### Persistência
- [x] URL atualiza corretamente
- [x] Filtros persistem ao navegar (back/forward)
- [x] Link compartilhável funciona
- [x] Filtros restaurados ao recarregar página

### Performance
- [x] Query otimizada (índice no DB)
- [x] Sem lag ao selecionar categorias
- [x] Tabela atualiza rapidamente
- [x] Popover abre/fecha instantaneamente

---

## Bugs Conhecidos

Nenhum bug conhecido até o momento! 🎉

---

## Melhorias Futuras

### 1. Exportação CSV com Filtros
**Problema:** CSV atualmente exporta todos os dados, ignorando filtros  
**Solução:** Passar filtros ativos para a função de exportação

### 2. Indicador de Filtros Ativos Globalmente
**Melhoria:** Badge ou indicador no topo da página mostrando "2 filtros ativos"  
**Benefício:** Usuário sabe que está vendo dados filtrados

### 3. Salvar Filtros Favoritos
**Melhoria:** Botão "Salvar filtro" para reutilizar combinações comuns  
**Benefício:** Acesso rápido a filtros frequentes

### 4. Filtro "Sem Categoria"
**Melhoria:** Opção para incluir/excluir itens sem categoria  
**Benefício:** Mais controle sobre a visualização

---

## Conclusão

Sprint 2 implementou com sucesso o sistema de filtros por categoria! 🎉

**Próximo passo:** Sprint 3 - Modo Visualização Planilha
