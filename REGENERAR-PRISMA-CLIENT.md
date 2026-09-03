# ⚠️ IMPORTANTE: Regenerar Prisma Client

Após adicionar os novos models ao schema (`ApiKey`, `WorkspaceInvite`, `SavedReport`), você **DEVE** regenerar o Prisma Client.

## Erro Atual

```
Cannot read properties of undefined (reading 'findMany')
at prisma.apiKey.findMany
```

Isso acontece porque o Prisma Client ainda não conhece os novos models.

## Solução

Execute no terminal (no diretório do projeto):

```bash
npm run prisma:generate
```

Ou:

```bash
npx prisma generate
```

## Depois de Regenerar

Após regenerar, você também precisará criar e aplicar a migration:

```bash
npm run prisma:migrate
```

Isso criará as tabelas no banco de dados.

## Verificação

Após regenerar, o erro deve desaparecer e as rotas `/app/settings/api`, `/app/settings/team`, etc. devem funcionar.

