# 🔒 Solução: Banco de Dados Bloqueado

## Problema
O SQLite está bloqueado porque algum processo ainda está usando o banco `dev.db`.

## Solução Rápida

### Opção 1: Usar o Script Automático (Recomendado)

Execute no PowerShell (na raiz do projeto):

```powershell
.\fix-migration.ps1
```

O script vai:
1. Verificar processos Node.js rodando
2. Oferecer para encerrá-los
3. Aplicar a migration
4. Regenerar o Prisma Client

### Opção 2: Manual

#### Passo 1: Fechar TODOS os processos

1. **Feche o servidor Next.js** (Ctrl+C no terminal onde está rodando)
2. **Feche o Prisma Studio** (se estiver aberto)
3. **Feche o VS Code/Cursor** temporariamente (ou apenas a aba do terminal)

#### Passo 2: Aguardar alguns segundos

```powershell
Start-Sleep -Seconds 5
```

#### Passo 3: Aplicar migration

```powershell
npx prisma migrate deploy
```

Se ainda der erro, marque a migration como aplicada manualmente:

```powershell
npx prisma migrate resolve --applied 20251219165205_add_onboarding_completed
```

#### Passo 4: Regenerar Prisma Client

```powershell
npx prisma generate
```

#### Passo 5: Reiniciar servidor

```powershell
npm run dev
```

### Opção 3: Aplicar SQL Manualmente (Último Recurso)

Se nada funcionar, você pode aplicar o SQL diretamente:

1. Abra o arquivo `prisma/dev.db` com um editor SQLite (como DB Browser for SQLite)
2. Execute o SQL da migration: `prisma/migrations/20251219165205_add_onboarding_completed/migration.sql`
3. Depois marque como aplicada:

```powershell
npx prisma migrate resolve --applied 20251219165205_add_onboarding_completed
npx prisma generate
```

## Verificação

Após aplicar, verifique se funcionou:

```powershell
npx prisma studio
```

Na tabela `User`, deve existir a coluna `onboardingCompleted` com valor padrão `false`.

## Prevenção

Para evitar isso no futuro:
- Sempre feche o servidor antes de rodar migrations
- Feche o Prisma Studio antes de aplicar migrations
- Use `prisma migrate deploy` em produção (não `prisma migrate dev`)
