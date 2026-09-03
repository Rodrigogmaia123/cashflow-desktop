# ⚡ Solução Rápida - Aplicar Migration

## Opção Mais Rápida: Baixar DB Browser Manualmente

1. **Baixe o DB Browser for SQLite:**
   - Acesse: https://sqlitebrowser.org/dl/
   - Baixe a versão para Windows
   - Instale normalmente

2. **Feche TUDO:**
   - Servidor Next.js (Ctrl+C)
   - Prisma Studio (se aberto)

3. **Abra o DB Browser:**
   - File → Open Database
   - Navegue até: `C:\Users\Usuário\Desktop\Cashflow Pro\prisma\dev.db`

4. **Execute o SQL:**
   - Aba "Execute SQL"
   - Copie TODO o conteúdo de `aplicar-migration-manual.sql`
   - Cole e execute (F5)

5. **Marque como aplicada:**
   ```powershell
   npx prisma migrate resolve --applied 20251219165205_add_onboarding_completed
   ```

6. **Reinicie:**
   ```powershell
   npm run dev
   ```

## Alternativa: Usar Prisma Studio (Limitado)

O Prisma Studio não permite executar SQL customizado, então você precisa do DB Browser.

## Alternativa 2: Recriar Banco (Se não tiver dados importantes)

```powershell
# Fazer backup
copy prisma\dev.db prisma\dev.db.backup

# Deletar banco
del prisma\dev.db

# Recriar com todas as migrations
npx prisma migrate dev
```

Isso vai recriar o banco do zero com todas as migrations aplicadas automaticamente.
