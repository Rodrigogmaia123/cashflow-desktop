# 🧪 Como Testar o Sistema de Emails

Guia rápido para testar se o sistema de emails está funcionando corretamente.

## 📋 Pré-requisitos

1. Variáveis de ambiente configuradas no `.env`:
   ```env
   RESEND_API_KEY="re_..."
   EMAIL_FROM="Cashflow Pro <no-reply@cashflowpro.com>"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

2. Dependências instaladas:
   ```bash
   npm install
   ```

## 🚀 Testes Disponíveis

### 1. Teste Simples (Email de Boas-vindas)

Testa apenas o email de boas-vindas:

```bash
npx tsx scripts/test-email.ts seu-email@exemplo.com
```

Ou usando o script npm:

```bash
npm run test:email seu-email@exemplo.com
```

**O que faz:**
- Verifica se as variáveis de ambiente estão configuradas
- Envia um email de boas-vindas para o email fornecido
- Mostra erros detalhados se algo falhar

### 2. Teste Completo (Todos os Templates)

Testa todos os 6 templates de email:

```bash
npx tsx scripts/test-all-emails.ts seu-email@exemplo.com
```

**O que faz:**
- Envia todos os tipos de email (boas-vindas, reset, magic link, billing)
- Mostra resultado de cada teste
- Aguarda 1 segundo entre cada email

## 📊 Exemplo de Saída

```
🧪 Testando sistema de emails...

📋 Verificando variáveis de ambiente:
   RESEND_API_KEY: ✅ Configurada
   EMAIL_FROM: ✅ Configurada
   NEXT_PUBLIC_APP_URL: ✅ Configurada

📧 Tentando enviar email de teste para: teste@exemplo.com

✅ Email enviado com sucesso!
   Verifique a caixa de entrada de teste@exemplo.com
   (Pode estar na pasta de spam)

✨ Teste concluído!
```

## 🔍 Troubleshooting

### Erro: "RESEND_API_KEY não configurada"

**Solução:**
1. Verifique se o arquivo `.env` existe na raiz do projeto
2. Verifique se a variável está escrita corretamente: `RESEND_API_KEY="re_..."`
3. Reinicie o servidor após adicionar variáveis

### Erro: "EMAIL_FROM não configurada"

**Solução:**
1. Adicione no `.env`: `EMAIL_FROM="Cashflow Pro <no-reply@cashflowpro.com>"`
2. Use o formato: `"Nome <email@dominio.com>"`

### Email não chega

**Possíveis causas:**
1. **Spam**: Verifique a pasta de spam/lixo eletrônico
2. **API Key inválida**: Verifique se a chave está correta no Resend
3. **Domínio não verificado**: Em desenvolvimento, use o domínio padrão do Resend
4. **Limite excedido**: Verifique o limite de envios no dashboard do Resend

### Erro ao renderizar template

**Solução:**
1. Verifique se `@react-email/render` está instalado: `npm list @react-email/render`
2. Reinstale as dependências: `npm install`
3. Verifique os logs para ver qual template está falhando

## 📝 Notas

- **Desenvolvimento**: Emails são enviados mesmo em desenvolvimento (usando Resend real)
- **Rate Limit**: Resend tem limite de 100 emails/dia no plano gratuito
- **Domínio**: Para produção, configure um domínio verificado no Resend
- **Logs**: Todos os envios são logados no console com prefixo `[email]`

## ✅ Checklist de Teste

- [ ] Variáveis de ambiente configuradas
- [ ] Teste simples executado com sucesso
- [ ] Email recebido na caixa de entrada
- [ ] Template renderizado corretamente
- [ ] Links funcionando no email
- [ ] Design responsivo (teste em mobile)

---

**Última atualização:** Dezembro 2024

