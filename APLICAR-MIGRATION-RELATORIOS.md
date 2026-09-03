# Aplicar Migration - Relatórios Personalizados

## Passo 1: Gerar Migration

Execute o comando para gerar a migration baseada nas mudanças do schema:

```bash
npx prisma migrate dev --name update_saved_reports_schema
```

## Passo 2: Se houver dados existentes

Se você já tem relatórios salvos no banco, será necessário migrar os dados:

1. Os relatórios antigos usavam `config` (JSON)
2. Os novos usam `type`, `filters`, `visualization`

### Script de migração (opcional)

Se necessário, execute este script SQL após a migration:

```sql
-- Atualiza relatórios existentes para o novo formato
-- Define tipo padrão como CASHFLOW
UPDATE "SavedReport"
SET 
  "type" = 'CASHFLOW',
  "filters" = "config",
  "visualization" = 'TABLE'
WHERE "type" IS NULL;
```

## Passo 3: Regenerar Prisma Client

```bash
npx prisma generate
```

## Passo 4: Reiniciar o servidor

```bash
npm run dev
```

## Verificação

1. Acesse `/app/settings/reports`
2. Tente salvar um novo relatório
3. Verifique se os relatórios são listados corretamente
4. Teste o botão "Carregar" para aplicar filtros

