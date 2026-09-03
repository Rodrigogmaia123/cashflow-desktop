# Limpar Cache do Next.js após Regenerar Prisma Client

Após executar `prisma generate`, o Next.js pode estar usando um cache antigo do Prisma Client.

## Solução Rápida

1. **Pare o servidor Next.js** (Ctrl+C no terminal onde está rodando)

2. **Limpe o cache do Next.js:**
   ```bash
   rm -rf .next
   ```
   Ou no Windows PowerShell:
   ```powershell
   Remove-Item -Recurse -Force .next
   ```

3. **Reinicie o servidor:**
   ```bash
   npm run dev
   ```

## Alternativa: Reiniciar o Servidor

Se não quiser limpar o cache, simplesmente:
1. Pare o servidor (Ctrl+C)
2. Reinicie com `npm run dev`

O Next.js deve recarregar o Prisma Client atualizado.

