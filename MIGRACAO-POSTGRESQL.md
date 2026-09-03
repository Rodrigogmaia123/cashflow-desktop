# Migração de SQLite para PostgreSQL

Este documento descreve as mudanças realizadas e os próximos passos para completar a migração.

## Mudanças Realizadas

### 1. Schema Prisma Atualizado
- ✅ Provider alterado de `sqlite` para `postgresql`
- ✅ Comentários específicos do SQLite removidos
- ✅ Campos String convertidos para Enums nativos do PostgreSQL:
  - `ExpenseType` (VARIABLE, FIXED)
  - `CategoryType` (INCOME, EXPENSE, BOTH)
  - `MetricLevel` (INFO, WARN, ERROR)
  - `UserPlan` (FREE, PRO, BUSINESS)
  - `SubscriptionPlan` (PRO, BUSINESS)
  - `AccountType` (PF, PJ)
  - `OfferStatus` (ACTIVE, INACTIVE, ARCHIVED)
  - `SubscriptionStatus` (active, canceled, past_due, etc.)

### 2. Documentação Atualizada
- ✅ `ENV-TEMPLATE.md` atualizado com exemplo de DATABASE_URL do PostgreSQL
- ✅ `README.md` já continha exemplo correto

## Próximos Passos

### 1. Configurar Banco de Dados PostgreSQL

Você precisa ter um banco PostgreSQL rodando. Opções:

#### Opção A: PostgreSQL Local
```bash
# Instalar PostgreSQL (se ainda não tiver)
# Windows: https://www.postgresql.org/download/windows/
# macOS: brew install postgresql
# Linux: sudo apt-get install postgresql

# Criar banco de dados
createdb cashflow_pro

# Ou via psql:
psql -U postgres
CREATE DATABASE cashflow_pro;
```

#### Opção B: PostgreSQL em Docker
```bash
docker run --name cashflow-postgres \
  -e POSTGRES_PASSWORD=senha_segura \
  -e POSTGRES_DB=cashflow_pro \
  -p 5432:5432 \
  -d postgres:16
```

#### Opção C: Serviço Gerenciado (Recomendado para produção)
- **Supabase**: https://supabase.com (gratuito até 500MB)
- **Neon**: https://neon.tech (gratuito com tier generoso)
- **Railway**: https://railway.app
- **Vercel Postgres**: Integrado com Vercel

### 2. Atualizar Arquivo .env

Atualize o arquivo `.env` na raiz do projeto:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://usuario:senha@localhost:5432/cashflow_pro?schema=public"

# Para serviços gerenciados, use a connection string fornecida por eles
# Exemplo Supabase:
# DATABASE_URL="postgresql://postgres:[SENHA]@[HOST]:5432/postgres?sslmode=require"
```

### 3. Gerar Cliente Prisma

```bash
npm run prisma:generate
```

### 4. Criar Migration Inicial

```bash
npm run prisma:migrate
```

Isso criará uma nova migration com todas as tabelas e enums do PostgreSQL.

**Nome sugerido para a migration**: `init_postgresql`

### 5. (Opcional) Migrar Dados do SQLite

Se você tem dados importantes no SQLite que precisa migrar:

1. **Exportar dados do SQLite**:
```bash
# Instalar sqlite3 se necessário
sqlite3 prisma/dev.db .dump > backup.sql
```

2. **Adaptar o dump para PostgreSQL** (pode precisar de ajustes manuais):
   - Remover comandos específicos do SQLite
   - Ajustar tipos de dados
   - Converter valores de String para Enums

3. **Importar no PostgreSQL**:
```bash
psql -U usuario -d cashflow_pro -f backup_adaptado.sql
```

**Nota**: A migração de dados pode ser complexa devido aos enums. Considere usar um script de migração customizado.

### 6. Verificar e Testar

```bash
# Verificar se o banco está conectado
npm run prisma:studio

# Rodar seed (se necessário)
npm run db:seed

# Iniciar aplicação
npm run dev
```

## Diferenças Importantes: SQLite vs PostgreSQL

### Enums
- **SQLite**: Não suporta enums nativos, usávamos String
- **PostgreSQL**: Suporta enums nativos, melhor tipagem e performance

### Tipos de Dados
- **Decimal**: Funciona igual em ambos
- **DateTime**: Funciona igual em ambos
- **String**: Funciona igual em ambos

### Performance
- **PostgreSQL**: Melhor para produção, suporta concorrência, transações complexas
- **SQLite**: Melhor para desenvolvimento local simples

### Limitações Removidas
- Agora podemos usar enums nativos
- Melhor suporte a índices compostos
- Suporte a funcionalidades avançadas (JSON, arrays, etc.)

## Troubleshooting

### Erro: "relation does not exist"
- Execute a migration: `npm run prisma:migrate`

### Erro: "enum type does not exist"
- O Prisma deve criar os enums automaticamente na migration
- Verifique se a migration foi aplicada corretamente

### Erro de conexão
- Verifique se o PostgreSQL está rodando
- Confirme a DATABASE_URL no `.env`
- Teste a conexão: `psql -U usuario -d cashflow_pro`

## Rollback (se necessário)

Se precisar voltar para SQLite temporariamente:

1. Reverter o schema.prisma:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

2. Converter enums de volta para String
3. Executar migration

**Nota**: Isso pode causar perda de dados se você já migrou para PostgreSQL.

