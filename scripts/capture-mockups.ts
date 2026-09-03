/**
 * Script para capturar screenshots dos mockups
 * 
 * Requisitos:
 * 1. Instalar puppeteer: npm install -D puppeteer
 * 2. Executar o servidor: npm run dev
 * 3. Executar este script: npx tsx scripts/capture-mockups.ts
 * 
 * O script captura screenshots de cada mockup e salva em /public/images/
 */

import puppeteer from "puppeteer";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const BASE_URL = "http://localhost:3000";
const OUTPUT_DIR = join(process.cwd(), "public", "images");

const mockups = [
  {
    name: "dashboard",
    url: `${BASE_URL}/mockups?type=dashboard`,
    output: "preview-dashboard.png",
  },
  {
    name: "cashflow",
    url: `${BASE_URL}/mockups?type=cashflow`,
    output: "preview-cashflow.png",
  },
  {
    name: "overview",
    url: `${BASE_URL}/mockups?type=overview`,
    output: "preview-overview.png",
  },
  {
    name: "offers",
    url: `${BASE_URL}/mockups?type=offers`,
    output: "preview-offers.png",
  },
];

// Helper function para delay (substitui waitForTimeout)
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function captureMockup(
  browser: any,
  mockup: { name: string; url: string; output: string }
) {
  console.log(`Capturando ${mockup.name}...`);

  const page = await browser.newPage();

  // Configurar viewport para alta resolução
  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 2, // Para alta resolução
  });

  // Navegar para a página
  await page.goto(mockup.url, {
    waitUntil: "networkidle0",
  });

  // Aguardar um pouco para garantir que tudo carregou (especialmente animações CSS)
  await delay(1000);

  // Capturar screenshot
  const screenshot = await page.screenshot({
    fullPage: true,
    type: "png",
  });

  // Salvar arquivo
  const outputPath = join(OUTPUT_DIR, mockup.output);
  await writeFile(outputPath, screenshot);

  console.log(`✓ ${mockup.output} salvo em ${outputPath}`);

  await page.close();
}

async function main() {
  console.log("Iniciando captura de mockups...\n");

  // Criar diretório de saída se não existir
  try {
    await mkdir(OUTPUT_DIR, { recursive: true });
  } catch (error) {
    // Diretório já existe, tudo bem
  }

  // Verificar se o servidor está rodando
  try {
    const response = await fetch(BASE_URL);
    if (!response.ok) {
      throw new Error("Servidor não está respondendo");
    }
  } catch (error) {
    console.error(
      "❌ Erro: O servidor Next.js não está rodando!"
    );
    console.error("Execute 'npm run dev' em outro terminal primeiro.\n");
    process.exit(1);
  }

  // Iniciar browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    // Capturar cada mockup
    for (const mockup of mockups) {
      await captureMockup(browser, mockup);
    }

    console.log("\n✅ Todos os screenshots foram capturados com sucesso!");
    console.log(`📁 Arquivos salvos em: ${OUTPUT_DIR}\n`);
  } catch (error) {
    console.error("❌ Erro ao capturar screenshots:", error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();

