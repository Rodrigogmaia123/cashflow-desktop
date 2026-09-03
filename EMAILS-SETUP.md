# 📧 Sistema de Emails Transacionais - Cashflow Pro

Sistema completo de emails transacionais usando **Resend** e **React Email**, integrado com autenticação, onboarding e billing.

## 📋 Índice

- [Configuração](#configuração)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Estrutura do Sistema](#estrutura-do-sistema)
- [Templates Disponíveis](#templates-disponíveis)
- [Como Testar Localmente](#como-testar-localmente)
- [Lista de Emails Disparados](#lista-de-emails-disparados)
- [Como Adicionar Novos Templates](#como-adicionar-novos-templates)
- [Troubleshooting](#troubleshooting)

---

## ⚙️ Configuração

### 1. Criar conta no Resend

1. Acesse [resend.com](https://resend.com)
2. Crie uma conta gratuita
3. Vá em **API Keys** e crie uma nova chave
4. Copie a chave (formato: `re_...`)

### 2. Configurar domínio (Opcional para produção)

Para produção, configure um domínio verificado no Resend:

1. Vá em **Domains** no dashboard do Resend
2. Adicione seu domínio (ex: `cashflowpro.com`)
3. Configure os registros DNS conforme instruções
4. Use o domínio verificado no `EMAIL_FROM`

### 3. Variáveis de Ambiente

Adicione as seguintes variáveis no seu arquivo `.env`:

```env
# Resend API Key
RESEND_API_KEY="re_..."

# Email remetente (formato: "Nome <email@dominio.com>")
EMAIL_FROM="Cashflow Pro <no-reply@cashflowpro.com>"

# URL base da aplicação (usado nos links dos emails)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Nota:** Para desenvolvimento local, você pode usar o domínio padrão do Resend (`onboarding@resend.dev`), mas emails enviados de domínios não verificados podem ir para spam.

---

## 📁 Estrutura do Sistema

```
lib/email/
├── resend.ts          # Cliente Resend (server-only)
├── send-email.ts      # Helpers genéricos para envio
├── types.ts           # Tipos TypeScript
└── templates.ts       # Mapeamento template → componente React

emails/
├── welcome-email.tsx
├── reset-password.tsx
├── magic-link.tsx
├── subscription-confirmed.tsx
├── subscription-canceled.tsx
└── subscription-failed.tsx
```

### Arquitetura

O sistema segue uma arquitetura em camadas:

1. **Cliente Resend** (`lib/email/resend.ts`)
   - Inicializa o cliente Resend
   - Valida variáveis de ambiente

2. **Helpers de Envio** (`lib/email/send-email.ts`)
   - Funções específicas para cada tipo de email
   - Formatação de dados e URLs
   - Tratamento de erros (não bloqueia fluxo)

3. **Templates** (`lib/email/templates.ts`)
   - Renderiza templates React Email para HTML
   - Mapeamento tipo → componente

4. **Componentes React Email** (`emails/*.tsx`)
   - Templates visuais usando `@react-email/components`
   - Design dark-friendly
   - Responsivos e acessíveis

---

## 📧 Templates Disponíveis

### 1. **Boas-vindas** (`welcome`)

**Quando é disparado:**
- Usuário cria conta (email/senha ou OAuth)

**Props:**
- `name`: Nome do usuário
- `loginUrl`: URL para acessar o painel

**Exemplo:**
```typescript
await sendWelcomeEmail("user@example.com", "João Silva");
```

### 2. **Reset de Senha** (`reset-password`)

**Quando é disparado:**
- Usuário solicita recuperação de senha

**Props:**
- `resetUrl`: URL com token de reset
- `expiresIn`: Tempo de expiração (ex: "1 hora")

**Exemplo:**
```typescript
await sendResetPasswordEmail("user@example.com", token);
```

### 3. **Magic Link** (`magic-link`)

**Quando é disparado:**
- Usuário solicita login via magic link

**Props:**
- `loginUrl`: URL de login com token
- `expiresIn`: Tempo de expiração (ex: "15 minutos")

**Exemplo:**
```typescript
await sendMagicLinkEmail("user@example.com", url);
```

### 4. **Assinatura Confirmada** (`subscription-confirmed`)

**Quando é disparado:**
- Webhook `checkout.session.completed` do Stripe
- Assinatura ativada com sucesso

**Props:**
- `plan`: Nome do plano (PRO, BUSINESS)
- `amount`: Valor formatado (ex: "R$ 99,00")
- `billingUrl`: URL para gerenciar assinatura

**Exemplo:**
```typescript
await sendSubscriptionConfirmedEmail(
  "user@example.com",
  "PRO",
  "R$ 99,00"
);
```

### 5. **Assinatura Cancelada** (`subscription-canceled`)

**Quando é disparado:**
- Webhook `customer.subscription.deleted` do Stripe
- Usuário cancela assinatura

**Props:**
- `plan`: Nome do plano cancelado
- `billingUrl`: URL para gerenciar assinatura

**Exemplo:**
```typescript
await sendSubscriptionCanceledEmail("user@example.com", "PRO");
```

### 6. **Falha de Pagamento** (`subscription-failed`)

**Quando é disparado:**
- Webhook `invoice.payment_failed` do Stripe
- Falha ao processar pagamento recorrente

**Props:**
- `plan`: Nome do plano
- `amount`: Valor que falhou
- `billingUrl`: URL para atualizar método de pagamento

**Exemplo:**
```typescript
await sendSubscriptionFailedEmail(
  "user@example.com",
  "PRO",
  "R$ 99,00"
);
```

---

## 🧪 Como Testar Localmente

### 1. Usar Resend em Desenvolvimento

O Resend permite enviar emails reais mesmo em desenvolvimento. Basta:

1. Configurar `RESEND_API_KEY` no `.env`
2. Usar um email real para teste
3. Verificar a caixa de entrada (e spam)

### 2. Testar Templates Individualmente

Você pode criar um script de teste:

```typescript
// scripts/test-email.ts
import { sendWelcomeEmail } from "@/lib/email/send-email";

async function test() {
  await sendWelcomeEmail("seu-email@exemplo.com", "Teste");
}

test();
```

Execute:
```bash
npx tsx scripts/test-email.ts
```

### 3. Preview de Templates (React Email)

React Email oferece um servidor de preview:

```bash
npx email dev
```

Isso abre um servidor local onde você pode visualizar todos os templates.

### 4. Verificar Logs

Todos os envios são logados no console:

```
[email] Email welcome enviado para user@example.com
[email] Erro ao enviar email reset-password: ...
```

---

## 📋 Lista de Emails Disparados

### Autenticação

| Evento | Template | Arquivo |
|-------|----------|---------|
| Registro de conta | `welcome` | `lib/auth/actions.ts` |
| Solicitação de reset de senha | `reset-password` | `lib/auth/actions.ts` |
| Solicitação de magic link | `magic-link` | `lib/auth/options.ts` |

### Billing

| Evento Stripe | Template | Arquivo |
|---------------|----------|---------|
| `checkout.session.completed` | `subscription-confirmed` | `app/api/webhooks/stripe/route.ts` |
| `customer.subscription.deleted` | `subscription-canceled` | `app/api/webhooks/stripe/route.ts` |
| `invoice.payment_failed` | `subscription-failed` | `app/api/webhooks/stripe/route.ts` |

---

## ➕ Como Adicionar Novos Templates

### Passo 1: Criar Componente React Email

Crie um novo arquivo em `emails/`:

```typescript
// emails/novo-email.tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";

interface NovoEmailProps {
  name: string;
  actionUrl: string;
}

export function NovoEmail({ name, actionUrl }: NovoEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Assunto do email</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Olá, {name}!</Heading>
          <Text style={text}>Conteúdo do email...</Text>
          <Button style={button} href={actionUrl}>
            Ação
          </Button>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#0a0a0a",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
};

const container = {
  backgroundColor: "#1a1a1a",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "600px",
  borderRadius: "8px",
};

// ... estilos
```

### Passo 2: Adicionar ao Mapeamento

Atualize `lib/email/types.ts`:

```typescript
export type EmailTemplate =
  | "welcome"
  | "reset-password"
  | "magic-link"
  | "subscription-confirmed"
  | "subscription-canceled"
  | "subscription-failed"
  | "novo-email"; // ← Adicione aqui
```

Atualize `lib/email/templates.ts`:

```typescript
import { NovoEmail } from "@/emails/novo-email";

export async function renderEmailTemplate(...) {
  switch (template) {
    // ... casos existentes
    case "novo-email":
      return render(
        NovoEmail(props as { name: string; actionUrl: string })
      );
  }
}
```

### Passo 3: Criar Helper

Adicione em `lib/email/send-email.ts`:

```typescript
export async function sendNovoEmail(
  email: string,
  name: string
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  await sendEmail({
    to: email,
    subject: "Assunto do email",
    template: "novo-email",
    props: {
      name,
      actionUrl: `${appUrl}/app/action`,
    },
  });
}
```

### Passo 4: Usar no Código

```typescript
import { sendNovoEmail } from "@/lib/email/send-email";

await sendNovoEmail("user@example.com", "João");
```

---

## 🔧 Troubleshooting

### Email não está sendo enviado

1. **Verifique as variáveis de ambiente:**
   ```bash
   echo $RESEND_API_KEY
   echo $EMAIL_FROM
   ```

2. **Verifique os logs:**
   - Procure por `[email]` no console
   - Erros são logados mas não bloqueiam o fluxo

3. **Teste a API Key:**
   - Acesse o dashboard do Resend
   - Verifique se a chave está ativa
   - Verifique o limite de envios

### Emails indo para spam

1. **Configure SPF/DKIM:**
   - Use um domínio verificado no Resend
   - Configure os registros DNS corretamente

2. **Conteúdo do email:**
   - Evite palavras spam (ex: "grátis", "oferta")
   - Use texto claro e profissional
   - Inclua link de descadastro (opcional)

### Erro: "RESEND_API_KEY não configurada"

- Verifique se a variável está no `.env`
- Reinicie o servidor após adicionar variáveis
- Verifique se não há espaços extras na chave

### Erro: "Template desconhecido"

- Verifique se o template está em `lib/email/types.ts`
- Verifique se o caso está em `lib/email/templates.ts`
- Verifique se o componente React Email existe

### Magic Link não funciona

- O NextAuth EmailProvider agora usa Resend
- Verifique se `EMAIL_FROM` está configurado
- O email é enviado via `sendVerificationRequest` customizado

---

## 📚 Recursos

- [Documentação Resend](https://resend.com/docs)
- [React Email Docs](https://react.email/docs)
- [NextAuth Email Provider](https://next-auth.js.org/providers/email)

---

## ✅ Checklist de Produção

Antes de ir para produção:

- [ ] Domínio verificado no Resend
- [ ] SPF/DKIM configurados
- [ ] `EMAIL_FROM` usando domínio verificado
- [ ] `NEXT_PUBLIC_APP_URL` apontando para produção
- [ ] Testado todos os templates
- [ ] Logs de erro configurados
- [ ] Monitoramento de taxa de entrega

---

**Última atualização:** Dezembro 2024

