# Como Capturar Screenshots dos Mockups

Este guia explica como gerar os screenshots dos dashboards para usar na landing page.

## Opção 1: Captura Manual (Recomendado para início rápido)

1. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

2. **Acesse cada mockup no navegador:**
   - Dashboard: http://localhost:3000/mockups?type=dashboard
   - Cashflow: http://localhost:3000/mockups?type=cashflow
   - Overview: http://localhost:3000/mockups?type=overview
   - Offers: http://localhost:3000/mockups?type=offers

3. **Capture screenshots manualmente:**
   - Use ferramentas como:
     - **Windows**: Snipping Tool, ShareX, ou Print Screen
     - **Mac**: Cmd+Shift+4
     - **Navegador**: Extensões como "Full Page Screen Capture"
   - Salve as imagens em `public/images/` com os nomes:
     - `preview-dashboard.png`
     - `preview-cashflow.png`
     - `preview-overview.png`
     - `preview-offers.png`

## Opção 2: Captura Automática com Puppeteer

1. **Instale o Puppeteer:**
   ```bash
   npm install -D puppeteer
   npm install -D @types/puppeteer
   ```

2. **Inicie o servidor em um terminal:**
   ```bash
   npm run dev
   ```

3. **Em outro terminal, execute o script:**
   ```bash
   npx tsx scripts/capture-mockups.ts
   ```

   O script irá:
   - Verificar se o servidor está rodando
   - Capturar cada mockup automaticamente
   - Salvar os screenshots em `public/images/`

## Opção 3: Usar Playwright (Alternativa)

1. **Instale o Playwright:**
   ```bash
   npm install -D playwright
   ```

2. **Crie um script similar usando Playwright API**

## Dicas para Melhores Screenshots

- **Resolução**: Use pelo menos 1920x1080 para alta qualidade
- **Zoom**: Configure o navegador para 100% (sem zoom)
- **Modo Escuro**: Os mockups já estão em dark mode
- **Full Page**: Capture a página inteira, não apenas o viewport
- **Formato**: Use PNG para melhor qualidade

## Estrutura de Arquivos Esperada

Após capturar, você deve ter:

```
public/
  images/
    preview-dashboard.png
    preview-cashflow.png
    preview-overview.png
    preview-offers.png
```

## Verificação

Após adicionar as imagens, verifique se estão acessíveis:
- http://localhost:3000/images/preview-dashboard.png
- http://localhost:3000/images/preview-cashflow.png
- http://localhost:3000/images/preview-overview.png
- http://localhost:3000/images/preview-offers.png

