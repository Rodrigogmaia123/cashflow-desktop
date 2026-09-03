# Resolver Drift do Prisma

O Prisma detectou que o banco de dados não está sincronizado com o histórico de migrations.

## Solução Segura (sem perder dados)

Use `prisma db push` para sincronizar o schema atual com o banco:

```bash
npx prisma db push
```

Isso irá:
- ✅ Adicionar as novas tabelas (`ApiKey`, `WorkspaceInvite`, `SavedReport`)
- ✅ Adicionar os novos enums (`WorkspaceRole`, `InviteStatus`)
- ✅ Atualizar a coluna `role` em `UserWorkspace` para usar o enum
- ✅ **NÃO** resetar o banco (mantém todos os dados)

## Alternativa: Baseline Migration

Se preferir criar uma migration baseline:

```bash
npx prisma migrate dev --create-only --name baseline
```

Depois edite a migration para incluir apenas as novas tabelas, não todas.

## Recomendação

Use `prisma db push` primeiro para adicionar as novas features sem risco.

