# Guia de Uso do Prisma Studio - Evitando Erros de Foreign Key

## ⚠️ Problema Comum

Ao tentar criar ou editar registros no Prisma Studio, você pode encontrar o erro:
```
Foreign key constraint violated: `UserWorkspace_userId_fkey (index)`
```

## 🔧 Solução: Limpar o Banco Antes de Usar o Prisma Studio

**SEMPRE execute este comando antes de abrir o Prisma Studio:**

```bash
npm run fix:foreign-keys-direct
```

Isso garante que não há dados órfãos que possam causar problemas.

## 📋 Passos Seguros para Usar o Prisma Studio

### 1. Preparação

```bash
# 1. Limpar dados órfãos
npm run fix:foreign-keys-direct

# 2. Regenerar Prisma Client (se necessário)
npx prisma generate

# 3. Abrir Prisma Studio
npx prisma studio
```

### 2. Criando UserWorkspace no Prisma Studio

**⚠️ NUNCA crie UserWorkspace diretamente no Prisma Studio sem verificar:**

1. **Verifique se o User existe:**
   - Vá para a tabela `User`
   - Anote o `id` do usuário que você quer usar
   - Certifique-se de que o ID está correto (formato CUID)

2. **Verifique se o Workspace existe:**
   - Vá para a tabela `Workspace`
   - Anote o `id` do workspace que você quer usar
   - Certifique-se de que o ID está correto (formato CUID)

3. **Crie o UserWorkspace:**
   - Vá para a tabela `UserWorkspace`
   - Clique em "Add record"
   - Preencha:
     - `userId`: Cole o ID exato do User (copie e cole, não digite)
     - `workspaceId`: Cole o ID exato do Workspace (copie e cole, não digite)
     - `role`: Digite "OWNER", "ADMIN" ou "MEMBER"
   - Clique em "Save 1 change"

### 3. Editando UserWorkspace

**⚠️ CUIDADO ao editar:**

- **NUNCA altere o `userId`** para um ID que não existe na tabela `User`
- **NUNCA altere o `workspaceId`** para um ID que não existe na tabela `Workspace`
- Sempre verifique se os IDs existem antes de salvar

### 4. Deletando Registros

**⚠️ CUIDADO ao deletar:**

- Se você deletar um `User`, todos os `UserWorkspace` relacionados devem ser deletados primeiro
- Se você deletar um `Workspace`, todos os `UserWorkspace` relacionados devem ser deletados primeiro

**Ordem segura para deletar:**

1. Deletar todos os `UserWorkspace` relacionados
2. Depois deletar o `User` ou `Workspace`

## 🚨 Se o Erro Acontecer no Prisma Studio

### Solução Rápida:

1. **Feche o Prisma Studio** (Ctrl+C no terminal)

2. **Execute o script de correção:**
   ```bash
   npm run fix:foreign-keys-direct
   ```

3. **Regenere o Prisma Client:**
   ```bash
   npx prisma generate
   ```

4. **Abra o Prisma Studio novamente:**
   ```bash
   npx prisma studio
   ```

### Verificar Dados Órfãos:

Execute este comando para ver se há dados órfãos:

```bash
npm run verify:prisma
```

## 💡 Dicas de Segurança

### ✅ FAÇA:

- ✅ Sempre copie e cole IDs (não digite manualmente)
- ✅ Verifique se os IDs existem antes de criar relacionamentos
- ✅ Use transações no código (não no Prisma Studio) para operações complexas
- ✅ Execute `npm run fix:foreign-keys-direct` antes de usar o Prisma Studio

### ❌ NÃO FAÇA:

- ❌ Não digite IDs manualmente (sempre copie e cole)
- ❌ Não crie UserWorkspace com IDs que não existem
- ❌ Não delete Users ou Workspaces sem deletar UserWorkspace primeiro
- ❌ Não use Prisma Studio para operações em produção

## 🔄 Workflow Recomendado

```bash
# 1. Antes de abrir o Prisma Studio
npm run fix:foreign-keys-direct
npx prisma generate

# 2. Abrir Prisma Studio
npx prisma studio

# 3. Após fazer alterações, verificar
npm run verify:prisma

# 4. Se houver problemas, corrigir
npm run fix:foreign-keys-direct
```

## 📝 Exemplo: Criar UserWorkspace Corretamente

1. Abra o Prisma Studio: `npx prisma studio`
2. Vá para a tabela `User` e encontre o usuário
3. Clique no usuário e copie o `id` (ex: `clx1234567890abcdef`)
4. Vá para a tabela `Workspace` e encontre o workspace
5. Clique no workspace e copie o `id` (ex: `clx0987654321fedcba`)
6. Vá para a tabela `UserWorkspace`
7. Clique em "Add record"
8. Cole o `userId` no campo `userId`
9. Cole o `workspaceId` no campo `workspaceId`
10. Digite "ADMIN" no campo `role`
11. Clique em "Save 1 change"

## 🛠️ Scripts Disponíveis

```bash
# Limpar dados órfãos (SQL direto - mais rápido)
npm run fix:foreign-keys-direct

# Verificar integridade
npm run verify:prisma

# Solução completa
npm run fix:prisma
```

## ⚡ Solução Rápida de Emergência

Se você está com erro no Prisma Studio AGORA:

```bash
# 1. Feche o Prisma Studio (Ctrl+C)

# 2. Execute a correção
npm run fix:foreign-keys-direct

# 3. Regenerar Prisma Client
npx prisma generate

# 4. Abrir novamente
npx prisma studio
```

Isso deve resolver 99% dos problemas!

