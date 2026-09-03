import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface SubscriptionFailedEmailProps {
  plan: string;
  amount: string;
  billingUrl: string;
}

export function SubscriptionFailedEmail({
  plan,
  amount,
  billingUrl,
}: SubscriptionFailedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Falha no pagamento - Cashflow Pro</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Falha no pagamento ⚠️</Heading>

          <Text style={text}>
            Não conseguimos processar o pagamento da sua assinatura do plano{" "}
            <strong>{plan}</strong>.
          </Text>

          <Section style={warningBox}>
            <Text style={warningText}>
              <strong>Valor:</strong> {amount}
            </Text>
            <Text style={warningText}>
              <strong>Plano:</strong> {plan}
            </Text>
          </Section>

          <Text style={text}>
            Isso pode ter acontecido por alguns motivos:
          </Text>

          <Text style={listItem}>• Cartão de crédito expirado</Text>
          <Text style={listItem}>• Limite do cartão excedido</Text>
          <Text style={listItem}>• Dados do cartão incorretos</Text>
          <Text style={listItem}>• Problema temporário com o banco</Text>

          <Text style={text}>
            Para evitar a interrupção do serviço, atualize seus dados de
            pagamento o quanto antes.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={billingUrl}>
              Atualizar método de pagamento
            </Button>
          </Section>

          <Text style={text}>
            Se você já atualizou seus dados de pagamento, pode ignorar este
            email. Tentaremos processar o pagamento novamente automaticamente.
          </Text>

          <Text style={footer}>
            Se precisar de ajuda, entre em contato conosco.
            <br />
            Equipe Cashflow Pro
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#0a0a0a",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#1a1a1a",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "600px",
  borderRadius: "8px",
};

const h1 = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "1.3",
  margin: "0 0 24px",
};

const text = {
  color: "#e0e0e0",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 16px",
};

const warningBox = {
  backgroundColor: "#dc262615",
  borderLeft: "4px solid #dc2626",
  borderRadius: "6px",
  padding: "20px",
  margin: "24px 0",
};

const warningText = {
  color: "#fca5a5",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 8px",
};

const listItem = {
  color: "#e0e0e0",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 8px",
  paddingLeft: "8px",
};

const buttonContainer = {
  margin: "32px 0",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#3b82f6",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const footer = {
  color: "#9ca3af",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "32px 0 0",
};

