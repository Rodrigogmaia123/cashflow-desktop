# Resolver Erro P1002 - Timeout ao Adquirir Advisory Lock

## 🔴 Problema

```
Error: P1002
The database server at `72.60.10.100:5439` was reached but timed out.
Context: Timed out trying to acquire a postgres advisory lock
```

## ✅ Solução Rápida

### Passo 1: Fechar Prisma Studio

**Se o Prisma Studio estiver aberto, feche-o completamente antes de executar migrations.**

O Prisma Studio mantém conexões ativas com o banco que bloqueiam o advisory lock necessário para migrations.

### Passo 2: Verificar Outros Processos

Verifique se há outros processos Prisma em execução:

**Windows (PowerShell):**
```powershell
Get-Process | Where-Object {$_.ProcessName -like "*node*" -or $_.ProcessName -like "*prisma*"}
```

**Ou verifique processos que podem estar usando a porta:**
```powershell
netstat -ano | findstr :5439
```

### Passo 3: Aguardar e Tentar Novamente

Após fechar o Prisma Studio, aguarde 5-10 segundos para as conexões serem liberadas, depois tente novamente:

```bash
npx prisma migrate deploy
```

## 🔧 Solução Alternativa: Aplicar Migration Manualmente

Se o erro persistir, você pode aplicar a migration SQL diretamente no banco:

### Opção 1: Via psql (Linha de Comando)

```bash
# Conectar ao banco
psql "postgresql://user:password@72.60.10.100:5439/cashflow"

# Executar a migration
\i prisma/migrations/20251224000000_add_cascade_delete_userworkspace/migration.sql

# Ou copiar e colar o conteúdo diretamente
```

### Opção 2: Via Ferramenta de Banco (pgAdmin, DBeaver, etc.)

1. Conecte ao banco PostgreSQL
2. Execute o SQL da migration:

```sql
-- DropForeignKey
ALTER TABLE "UserWorkspace" DROP CONSTRAINT "UserWorkspace_userId_fkey";
ALTER TABLE "UserWorkspace" DROP CONSTRAINT "UserWorkspace_workspaceId_fkey";

-- AddForeignKey
ALTER TABLE "UserWorkspace" ADD CONSTRAINT "UserWorkspace_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserWorkspace" ADD CONSTRAINT "UserWorkspace_workspaceId_fkey" 
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

3. Marcar a migration como aplicada (opcional, mas recomendado):

```sql
-- Verificar migrations aplicadas
SELECT * FROM "_prisma_migrations";

-- Se necessário, inserir registro manualmente (ajuste a data conforme necessário)
INSERT INTO "_prisma_migrations" (migration_name, applied_steps_count)
VALUES ('20251224000000_add_cascade_delete_userworkspace', 1)
ON CONFLICT DO NOTHING;
```

## 🔍 Verificar se a Migration Foi Aplicada

Após aplicar a migration, verifique se as foreign keys foram alteradas:

```sql
-- Ver constraints da tabela UserWorkspace
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'UserWorkspace'::regclass
AND contype = 'f';
```

Você deve ver `ON DELETE CASCADE` nas definições das constraints.

## ⚠️ Prevenção

Para evitar esse problema no futuro:

1. **Sempre feche o Prisma Studio antes de executar migrations**
2. **Use `prisma migrate dev` em desenvolvimento** (mais tolerante a locks)
3. **Use `prisma migrate deploy` em produção** (após testar)
4. **Aguarde alguns segundos** entre fechar o Studio e executar migrations

## 📝 Comandos Úteis

```bash
# Verificar status das migrations
npx prisma migrate status

# Aplicar migrations pendentes (após fechar Prisma Studio)
npx prisma migrate deploy

# Regenerar Prisma Client após aplicar migrations
npx prisma generate
```

## ✅ Checklist

- [ ] Prisma Studio fechado
- [ ] Aguardado 5-10 segundos
- [ ] Migration aplicada com sucesso
- [ ] Prisma Client regenerado
- [ ] Testado no Prisma Studio (pode reabrir após aplicar)

