// Script Node.js para aplicar a migration manualmente
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Aplicando migration...');
    
    // Ler o SQL do arquivo
    const sqlPath = path.join(__dirname, 'aplicar-migration-manual.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    
    // Executar SQL diretamente
    // Nota: Prisma não suporta execução direta de SQL complexo
    // Então vamos usar uma abordagem diferente
    
    // Verificar se a coluna já existe
    const result = await prisma.$queryRaw`
      SELECT name FROM pragma_table_info('User') WHERE name = 'onboardingCompleted'
    `;
    
    if (result.length > 0) {
      console.log('✅ Coluna onboardingCompleted já existe!');
      return;
    }
    
    console.log('⚠️  A coluna não existe. Aplicando migration...');
    console.log('📝 Por favor, use o DB Browser for SQLite ou Prisma Studio para aplicar o SQL manualmente.');
    console.log('📄 Arquivo SQL: aplicar-migration-manual.sql');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('\n💡 Solução alternativa:');
    console.log('1. Feche o servidor Next.js');
    console.log('2. Baixe DB Browser: https://sqlitebrowser.org/dl/');
    console.log('3. Abra prisma/dev.db no DB Browser');
    console.log('4. Execute o SQL do arquivo aplicar-migration-manual.sql');
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
