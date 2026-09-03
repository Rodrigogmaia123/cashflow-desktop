# Solução para Erro de Foreign Key Constraint

## Problema

Você está recebendo o erro:
```
Foreign key constraint violated: `UserWorkspace_userId_fkey (index)`
```

Este erro ocorre quando:
1. **Tentativa de criar um `UserWorkspace` com um `userId` que não existe** na tabela `User`
2. **Tentativa de deletar um `User` que ainda tem registros em `UserWorkspace`** (a constraint está configurada como `ON DELETE RESTRICT`)
3. **Uso do Prisma Studio** sem limpar dados órfãos primeiro

## ⚠️ Se você está usando Prisma Studio

**Leia primeiro:** [PRISMA-STUDIO-GUIDE.md](./PRISMA-STUDIO-GUIDE.md)

O Prisma Studio é muito útil, mas requer cuidado ao criar relacionamentos. Sempre execute:

```bash
npm run fix:foreign-keys-direct
```

Antes de abrir o Prisma Studio para evitar erros.

## Causas Comuns

1. **Dados órfãos no banco**: Registros em `UserWorkspace` com `userId` que não existe mais
2. **Problema durante criação**: Falha na transação que cria User + Workspace + UserWorkspace
3. **Sincronização**: Dados inconsistentes entre tabelas

## Solução

### Passo 1: Regenerar o Prisma Client

O Prisma Client pode estar desatualizado. Regenerar:

```bash
npx prisma generate
```

### Passo 2: Verificar o Prisma Client

Execute o script de verificação:

```bash
npm run verify:prisma
```

Este script irá:
- ✅ Testar conexão com o banco de dados
- ✅ Verificar se as tabelas existem
- ✅ Verificar integridade das foreign keys
- ✅ Testar criação de registros

### Passo 3: Executar o Script de Diagnóstico e Correção

Execute o script que criamos para diagnosticar e corrigir automaticamente os problemas:

```bash
npm run fix:foreign-keys
```

Este script irá:
- ✅ Verificar e remover `UserWorkspace` com `userId` inválido
- ✅ Verificar e remover `UserWorkspace` com `workspaceId` inválido
- ✅ Verificar e corrigir `activeWorkspaceId` inválidos
- ✅ Verificar se usuários têm acesso ao workspace ativo

### Passo 2: Verificar o Schema

O schema atual está correto. A constraint `ON DELETE RESTRICT` protege a integridade dos dados, impedindo que você delete um `User` que ainda tem workspaces associados.

Se você precisar permitir a deleção em cascata (não recomendado), você poderia alterar o schema:

```prisma
model UserWorkspace {
  userId      String
  workspaceId String
  role        String

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@id([userId, workspaceId])
}
```

**⚠️ ATENÇÃO**: Isso fará com que todos os `UserWorkspace` sejam deletados quando um `User` for deletado. Isso pode não ser o comportamento desejado.

### Passo 3: Verificar o Código

O código em `lib/auth/actions.ts` e `app/app/workspaces/actions.ts` está correto. Eles criam os registros dentro de transações, garantindo consistência.

## Prevenção

Para evitar este problema no futuro:

1. **Sempre use transações** ao criar relacionamentos (já está sendo feito)
2. **Valide dados antes de inserir** (já está sendo feito com Zod)
3. **Execute o script de diagnóstico periodicamente** se houver problemas

## Se o Problema Persistir

Se após executar o script o problema continuar:

1. Verifique os logs do Prisma para ver qual operação está falhando
2. Verifique se há migrations pendentes: `npx prisma migrate status`
3. Regenerar o Prisma Client: `npx prisma generate`
4. Verificar a conexão com o banco de dados

## Comandos Úteis

```bash
# 1. SOLUÇÃO DIRETA (RECOMENDADO SE O ERRO PERSISTIR)
npm run fix:foreign-keys-direct

# 2. Regenerar Prisma Client (SEMPRE FAÇA ISSO DEPOIS)
npx prisma generate

# 3. Solução completa (alternativa)
npm run fix:prisma

# 4. Verificar Prisma Client
npm run verify:prisma

# 5. Executar diagnóstico e correção (método alternativo)
npm run fix:foreign-keys

# 6. Verificar status das migrations
npx prisma migrate status

# 7. Abrir Prisma Studio para inspecionar dados
npx prisma studio
```

## Solução SQL Direta (Último Recurso)

Se nenhum script funcionar, execute o SQL diretamente no banco:

```bash
# PostgreSQL
psql $DATABASE_URL -f scripts/fix-foreign-key-direct.sql

# Ou copie e cole o conteúdo de scripts/fix-foreign-key-direct.sql
# diretamente no seu cliente SQL (pgAdmin, DBeaver, etc.)
```

## Solução Rápida (Recomendada)

**Se o erro persistir, use a solução DIRETA (mais eficiente):**

```bash
npm run fix:foreign-keys-direct
```

Este comando usa SQL direto para corrigir os problemas, sendo mais rápido e eficiente.

**OU execute o comando completo:**

```bash
npm run fix:prisma
```

Este comando irá:
1. ✅ Regenerar o Prisma Client
2. ✅ Verificar conexão com o banco
3. ✅ Verificar status das migrations
4. ✅ Corrigir dados órfãos
5. ✅ Corrigir activeWorkspaceId inválidos

## Solução Manual (Passo a Passo)

Se preferir executar manualmente, execute na ordem:

1. **Regenerar Prisma Client:**
   ```bash
   npx prisma generate
   ```

2. **Verificar integridade:**
   ```bash
   npm run verify:prisma
   ```

3. **Corrigir dados órfãos:**
   ```bash
   npm run fix:foreign-keys
   ```

4. **Se ainda não funcionar, verificar migrations:**
   ```bash
   npx prisma migrate status
   npx prisma migrate deploy
   ```

