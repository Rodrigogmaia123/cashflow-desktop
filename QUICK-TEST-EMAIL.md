# 🚀 Teste Rápido de Emails

## ✅ Passo a Passo

### 1. Verifique o `.env`

Certifique-se de que tem estas variáveis:

```env
RESEND_API_KEY="re_..."
EMAIL_FROM="Cashflow Pro <no-reply@cashflowpro.com>"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 2. Execute o Teste Simples

```bash
npx tsx scripts/test-email.ts seu-email@exemplo.com
```

**Exemplo:**
```bash
npx tsx scripts/test-email.ts spsrcray@gmail.com
```

### 3. O Que Esperar

**✅ Se funcionar:**
```
🧪 Testando sistema de emails...

📋 Verificando variáveis de ambiente:
   RESEND_API_KEY: ✅ Configurada
   EMAIL_FROM: ✅ Configurada
   NEXT_PUBLIC_APP_URL: ✅ Configurada

📧 Tentando enviar email de teste para: spsrcray@gmail.com

✅ Email enviado com sucesso!
   Verifique a caixa de entrada de spsrcray@gmail.com
   (Pode estar na pasta de spam)

✨ Teste concluído!
```

**❌ Se não funcionar:**
- Verifique se `RESEND_API_KEY` está correta
- Verifique se o email está no formato correto
- Veja os logs de erro para mais detalhes

### 4. Teste Todos os Templates (Opcional)

```bash
npx tsx scripts/test-all-emails.ts seu-email@exemplo.com
```

Isso enviará 6 emails diferentes para testar todos os templates.

---

## 🔍 Troubleshooting

### Erro: "RESEND_API_KEY não configurada"

**Solução:**
1. Verifique se o arquivo `.env` existe na raiz do projeto
2. Verifique se a variável está escrita corretamente (sem espaços extras)
3. Reinicie o terminal após editar o `.env`

### Email não chega

1. **Verifique a pasta de spam**
2. **Verifique o dashboard do Resend** - veja se o email foi enviado
3. **Verifique os logs** - procure por `[email]` no console

### Erro ao renderizar template

Se aparecer erro de renderização, pode ser problema com `@react-email/render`. Tente:

```bash
npm install @react-email/render@latest
```

---

**Pronto!** Agora você pode testar o sistema de emails. 🎉

