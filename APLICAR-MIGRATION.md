# ⚠️ IMPORTANTE: Aplicar Migration do Onboarding

O campo `onboardingCompleted` foi adicionado ao schema, mas a migration precisa ser aplicada ao banco de dados.

## Passo a Passo

### 1. Feche o servidor de desenvolvimento (se estiver rodando)
Pressione `Ctrl+C` no terminal onde o `npm run dev` está rodando.

### 2. Aplique a migration

Execute no terminal (na raiz do projeto):

```bash
npm run prisma:migrate
```

Ou diretamente:

```bash
npx prisma migrate dev
```

### 3. Regenerar o Prisma Client

```bash
npm run prisma:generate
```

Ou:

```bash
npx prisma generate
```

### 4. Reinicie o servidor

```bash
npm run dev
```

## Verificação

Após aplicar a migration, verifique se o campo foi criado:

```bash
npx prisma studio
```

No Prisma Studio, abra a tabela `User` e verifique se existe a coluna `onboardingCompleted` com valor padrão `false`.

## Solução de Problemas

### Se o banco estiver bloqueado:

1. Feche todas as instâncias do Prisma Studio
2. Feche o servidor Next.js
3. Aguarde alguns segundos
4. Tente novamente

### Se ainda der erro:

Execute:

```bash
npx prisma migrate resolve --applied 20251219165205_add_onboarding_completed
```

E depois:

```bash
npx prisma generate
```
