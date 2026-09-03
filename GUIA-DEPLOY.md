# Guia de Deploy - Onde Executar os Comandos

Este guia explica onde executar os comandos de build dependendo do seu ambiente de deploy.

## 📍 Onde Executar o Comando `docker build`?

### Opção 1: Se você está usando Docker diretamente (servidor próprio ou VPS)

**Execute o comando no terminal do seu servidor de produção:**

```bash
# 1. Conecte-se ao servidor via SSH
ssh usuario@seu-servidor.com

# 2. Navegue até a pasta do projeto
cd /caminho/do/seu/projeto

# 3. Execute o build
docker build --no-cache -t cashflow-pro .

# 4. Pare o container atual (se estiver rodando)
docker stop cashflow-pro
# ou
docker-compose down

# 5. Inicie o novo container
docker run -d -p 3000:3000 --env-file .env cashflow-pro
# ou
docker-compose up -d
```

---

### Opção 2: Se você está usando Railway, Render, Fly.io ou similar

**NÃO precisa executar `docker build` manualmente!** 🎉

Essas plataformas fazem o build automaticamente quando você faz push do código.

**O que fazer:**

1. **Faça commit das alterações:**
   ```bash
   git add .
   git commit -m "fix: corrigir Prisma no Alpine Linux e Server Actions"
   git push
   ```

2. **A plataforma detectará automaticamente:**
   - Se tiver `Dockerfile`, usará Docker
   - Se tiver `nixpacks.toml`, usará Nixpacks (Railway/Render)
   - Se tiver `vercel.json`, usará Vercel

3. **Verifique os logs do deploy** na dashboard da plataforma

**Para forçar um rebuild:**
- **Railway**: Vá em Settings > Deployments > Redeploy
- **Render**: Vá em Manual Deploy > Clear build cache & deploy
- **Fly.io**: Execute `flyctl deploy --no-cache`

---

### Opção 3: Se você está usando Vercel

**NÃO precisa executar `docker build`!**

Vercel não usa Dockerfile por padrão. Se você precisa de Docker no Vercel, precisa usar Vercel Docker.

**Para deploy normal no Vercel:**
```bash
# Instale a Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Ou simplesmente faça push:**
```bash
git push
# Vercel detecta automaticamente e faz o deploy
```

---

### Opção 4: Testar localmente antes de fazer deploy

**Execute no seu computador (PowerShell no Windows):**

```bash
# 1. Abra o PowerShell na pasta do projeto
cd "C:\Users\Usuário\Desktop\Cashflow Pro"

# 2. Execute o build (para testar)
docker build --no-cache -t cashflow-pro .

# 3. Teste localmente (opcional)
docker run -p 3000:3000 --env-file .env cashflow-pro
```

⚠️ **Importante**: Isso é apenas para testar. Para produção, siga a Opção 1 ou 2.

---

## 🔍 Como Saber Qual Opção Usar?

### Verifique se você tem:

1. **Dockerfile + servidor próprio/VPS** → **Opção 1**
2. **nixpacks.toml** → Provavelmente **Railway** ou **Render** → **Opção 2**
3. **vercel.json** ou deploy via Vercel → **Opção 3**
4. **Apenas testar localmente** → **Opção 4**

---

## 📝 Checklist de Deploy

### Antes do Deploy:

- [ ] Alterações commitadas no Git
- [ ] `Dockerfile` atualizado com dependências SSL
- [ ] `prisma/schema.prisma` com `binaryTargets` configurado
- [ ] `nixpacks.toml` atualizado (se usar Nixpacks)
- [ ] Variáveis de ambiente configuradas (`.env` ou na plataforma)

### Durante o Deploy:

- [ ] Build iniciado (automático ou manual)
- [ ] Prisma Client gerado corretamente
- [ ] Build completado sem erros

### Após o Deploy:

- [ ] Verificar logs do servidor
- [ ] Testar acesso à aplicação
- [ ] Verificar se Prisma está funcionando (sem erros SSL)
- [ ] Verificar se Server Actions estão funcionando

---

## 🆘 Problemas Comuns

### Erro: "docker: command not found"
**Solução**: Docker não está instalado. Instale o Docker Desktop ou use a Opção 2 (plataformas que fazem build automático).

### Erro: "Cannot connect to the Docker daemon"
**Solução**: O Docker não está rodando. Inicie o Docker Desktop.

### Erro: "permission denied"
**Solução**: No Linux, você pode precisar usar `sudo` ou adicionar seu usuário ao grupo docker:
```bash
sudo usermod -aG docker $USER
```

---

## 📚 Próximos Passos

1. Identifique qual opção se aplica ao seu caso
2. Siga as instruções da opção correspondente
3. Monitore os logs após o deploy
4. Teste a aplicação para garantir que tudo está funcionando

