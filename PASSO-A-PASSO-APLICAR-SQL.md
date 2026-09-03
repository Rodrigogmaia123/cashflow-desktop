# 🚀 Passo a Passo: Aplicar SQL Manualmente

## O Problema
A coluna `onboardingCompleted` não existe no banco de dados físico, mesmo que o Prisma Client já tenha sido regenerado.

## Solução: Aplicar SQL Manualmente

### Método 1: Usando Prisma Studio (Mais Fácil) ⭐

1. **Feche o servidor Next.js** (Ctrl+C)

2. **Abra o Prisma Studio:**
   ```powershell
   npx prisma studio
   ```

3. **No Prisma Studio:**
   - Clique na tabela "User"
   - Veja se a coluna `onboardingCompleted` existe
   - Se NÃO existir, feche o Prisma Studio e use o Método 2

### Método 2: Usando DB Browser for SQLite (Recomendado) ⭐⭐⭐

1. **Baixe o DB Browser for SQLite:**
   - Site: https://sqlitebrowser.org/dl/
   - Ou via PowerShell: `winget install DB Browser for SQLite`

2. **Feche TUDO:**
   - Servidor Next.js
   - Prisma Studio
   - Qualquer editor com dev.db aberto

3. **Abra o DB Browser:**
   - File → Open Database
   - Navegue até: `C:\Users\Usuário\Desktop\Cashflow Pro\prisma\dev.db`
   - Clique em "Open"

4. **Execute o SQL:**
   - Clique na aba "Execute SQL" (Execute SQL)
   - Abra o arquivo `aplicar-migration-manual.sql` no Cursor
   - **Copie TODO o conteúdo** do arquivo
   - **Cole no DB Browser**
   - Clique no botão "Execute SQL" (ou pressione F5)

5. **Verifique:**
   - Vá na aba "Browse Data"
   - Selecione a tabela "User"
   - Verifique se existe a coluna `onboardingCompleted` com valor `0` (false) para usuários existentes

6. **Feche o DB Browser**

7. **Marque a migration como aplicada:**
   ```powershell
   cd "C:\Users\Usuário\Desktop\Cashflow Pro"
   npx prisma migrate resolve --applied 20251219165205_add_onboarding_completed
   ```

8. **Reinicie o servidor:**
   ```powershell
   npm run dev
   ```

### Método 3: Via Terminal (SQLite CLI)

Se você tiver SQLite instalado:

1. **Feche TUDO** (servidor, Prisma Studio, etc)

2. **Execute:**
   ```powershell
   cd "C:\Users\Usuário\Desktop\Cashflow Pro\prisma"
   sqlite3 dev.db < ..\aplicar-migration-manual.sql
   ```

3. **Marque como aplicada:**
   ```powershell
   cd ..
   npx prisma migrate resolve --applied 20251219165205_add_onboarding_completed
   ```

## Verificação Final

Após aplicar o SQL, verifique:

```powershell
npx prisma studio
```

Na tabela `User`, deve existir a coluna `onboardingCompleted`.

## Se Der Erro

Se o DB Browser der erro ao executar o SQL, tente executar linha por linha, ou me avise qual erro apareceu.
