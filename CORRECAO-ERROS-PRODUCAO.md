# Correção de Erros em Produção

Este documento descreve as soluções para os erros encontrados no servidor de produção.

## Problemas Identificados

### 1. Erro do Prisma: `libssl.so.1.1: No such file or directory`

**Causa**: O Prisma está tentando usar o engine `libquery_engine-linux-musl.so.node`, mas o Alpine Linux não tem a biblioteca OpenSSL 1.1 instalada.

**Solução**:
1. ✅ Mudado para `node:20-slim` (Debian) ao invés de Alpine para melhor compatibilidade com Prisma
2. ✅ Instalado `openssl` no Dockerfile (Debian já inclui OpenSSL 3.x compatível)
3. ✅ Configurado `binaryTargets` no `prisma/schema.prisma` para `debian-openssl-3.0.x`

**Nota**: Se precisar usar Alpine (imagem menor), veja `Dockerfile.alpine` como alternativa, mas pode ter problemas de compatibilidade.

**Arquivos modificados**:
- `Dockerfile`: Adicionadas dependências SSL
- `prisma/schema.prisma`: Adicionado `binaryTargets` para Alpine Linux

### 2. Erro: `Failed to find Server Action "x"`

**Causa**: Este erro geralmente ocorre quando:
- O build está desatualizado ou corrompido
- Cache do Next.js está inconsistente
- Server Actions não foram gerados corretamente durante o build

**Soluções**:

#### Solução 1: Rebuild Completo (Recomendado)
```bash
# Limpar cache e node_modules
rm -rf .next node_modules

# Reinstalar dependências
npm ci

# Gerar Prisma Client
npx prisma generate

# Rebuild
npm run build
```

#### Solução 2: Limpar Cache do Next.js
```bash
# No servidor de produção
rm -rf .next
npm run build
```

#### Solução 3: Verificar Configuração do Next.js
Certifique-se de que o `next.config.mjs` não tenha configurações conflitantes.

## Deploy Correto

📖 **Consulte o arquivo `GUIA-DEPLOY.md` para instruções detalhadas sobre onde executar os comandos de deploy.**

### Passos para Deploy:

1. **Garantir que o Dockerfile está correto**:
   - ✅ Dependências SSL instaladas
   - ✅ Prisma generate executado antes do build

2. **Garantir que o schema.prisma está correto**:
   - ✅ `binaryTargets` configurado para Alpine

3. **Rebuild completo no servidor**:

   **Se usar Docker diretamente (servidor próprio/VPS):**
   ```bash
   # No ambiente de produção (via SSH)
   docker build --no-cache -t cashflow-pro .
   docker-compose down
   docker-compose up -d
   ```

   **Se usar Railway/Render/Fly.io:**
   ```bash
   # Apenas faça push - o build é automático!
   git add .
   git commit -m "fix: corrigir Prisma no Alpine"
   git push
   ```

   **Se usar Vercel:**
   ```bash
   vercel --prod
   # ou apenas git push
   ```

### Para Nixpacks (Railway, Render, etc.)

O arquivo `nixpacks.toml` já está configurado, mas pode ser necessário adicionar:

```toml
[phases.setup]
nixPkgs = ["nodejs_20", "npm-10_x", "openssl"]

[phases.build]
cmds = [
  "npx prisma generate",
  "npm run build"
]
```

## Verificações Pós-Deploy

1. Verificar logs do Prisma:
   ```bash
   docker logs <container-id> | grep prisma
   ```

2. Verificar se o Prisma Client foi gerado:
   ```bash
   docker exec <container-id> ls -la node_modules/.prisma/client/
   ```

3. Testar uma query simples:
   ```bash
   docker exec <container-id> node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.user.count().then(console.log);"
   ```

## Próximos Passos

- [ ] Testar o deploy com as correções
- [ ] Monitorar logs por 24h
- [ ] Verificar se Server Actions estão funcionando corretamente
- [ ] Adicionar health check para detectar problemas antecipadamente

## Referências

- [Prisma Binary Targets](https://www.prisma.io/docs/concepts/components/prisma-engines#binary-targets)
- [Prisma on Alpine Linux](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-docker#alpine-linux)
- [Next.js Server Actions](https://nextjs.org/docs/app/api-reference/functions/server-actions)

