# 🚀 Aplicar Migration para Features BUSINESS

O Prisma Client foi regenerado, mas as tabelas ainda não existem no banco de dados.

## Erro Atual

```
The table `public.ApiKey` does not exist in the current database.
```

## Solução

Execute a migration para criar as tabelas:

```bash
npm run prisma:migrate
```

Ou:

```bash
npx prisma migrate dev --name add_business_features
```

Isso irá:
1. Criar uma nova migration com os novos models (`ApiKey`, `WorkspaceInvite`, `SavedReport`)
2. Aplicar a migration no banco de dados
3. Criar as tabelas necessárias

## Tabelas que serão criadas

- `ApiKey` - Para gerenciar chaves de API (BUSINESS)
- `WorkspaceInvite` - Para sistema de convites (BUSINESS)
- `SavedReport` - Para relatórios personalizados (BUSINESS)
- Atualização do enum `WorkspaceRole` no `UserWorkspace`

## Após aplicar a migration

Todas as features BUSINESS estarão funcionais:
- ✅ `/app/settings/api` - Gerenciar API keys
- ✅ `/app/settings/team` - Gerenciar equipe
- ✅ `/app/settings/reports` - Relatórios personalizados
- ✅ `/app/support` - Suporte prioritário

