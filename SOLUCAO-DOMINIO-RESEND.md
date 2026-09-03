# 🔧 Solução: Domínio não verificado no Resend

## ❌ Erro Encontrado

```
The cashflowpro.com domain is not verified. Please, add and verify your domain on https://resend.com/domains
```

## ✅ Solução Rápida (Desenvolvimento)

Para desenvolvimento/testes, use o domínio padrão do Resend que **não precisa verificação**:

### Opção 1: Usar domínio padrão do Resend

No seu `.env`, altere:

```env
EMAIL_FROM="Cashflow Pro <onboarding@resend.dev>"
```

Ou deixe sem configurar - o sistema já usa `onboarding@resend.dev` por padrão.

### Opção 2: Verificar seu domínio (Produção)

Se você quer usar `cashflowpro.com` em produção:

1. Acesse [resend.com/domains](https://resend.com/domains)
2. Clique em **Add Domain**
3. Digite `cashflowpro.com`
4. Configure os registros DNS conforme instruções:
   - **SPF**: `v=spf1 include:resend.com ~all`
   - **DKIM**: Chave fornecida pelo Resend
   - **DMARC**: (opcional) `v=DMARC1; p=none;`
5. Aguarde a verificação (pode levar algumas horas)

Depois de verificado, você pode usar:

```env
EMAIL_FROM="Cashflow Pro <no-reply@cashflowpro.com>"
```

## 🎯 Recomendação

- **Desenvolvimento**: Use `onboarding@resend.dev` (já configurado como padrão)
- **Produção**: Configure e verifique seu domínio no Resend

## ✅ Teste Agora

Com o domínio padrão, execute novamente:

```bash
npx tsx scripts/test-email.ts seu-email@exemplo.com
```

Deve funcionar! 🎉

---

**Nota:** O domínio padrão do Resend (`onboarding@resend.dev`) funciona perfeitamente para desenvolvimento e testes. Só precisa verificar domínio próprio para produção.

