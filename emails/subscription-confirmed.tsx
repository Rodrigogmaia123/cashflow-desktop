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

interface SubscriptionConfirmedEmailProps {
  plan: string;
  amount: string;
  billingUrl: string;
}

export function SubscriptionConfirmedEmail({
  plan,
  amount,
  billingUrl,
}: SubscriptionConfirmedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Assinatura confirmada - Cashflow Pro</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Assinatura confirmada! 🎉</Heading>

          <Text style={text}>
            Sua assinatura do plano <strong>{plan}</strong> foi confirmada com
            sucesso!
          </Text>

          <Section style={infoBox}>
            <Text style={infoLabel}>Plano:</Text>
            <Text style={infoValue}>{plan}</Text>

            <Text style={infoLabel}>Valor:</Text>
            <Text style={infoValue}>{amount}</Text>
          </Section>

          <Text style={text}>
            Agora você tem acesso a todos os recursos do plano {plan}. Aproveite
            ao máximo o Cashflow Pro!
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={billingUrl}>
              Gerenciar assinatura
            </Button>
          </Section>

          <Text style={text}>
            Se você tiver alguma dúvida sobre sua assinatura, entre em contato
            conosco através do suporte.
          </Text>

          <Text style={footer}>
            Obrigado por confiar no Cashflow Pro!
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

const infoBox = {
  backgroundColor: "#262626",
  borderRadius: "6px",
  padding: "20px",
  margin: "24px 0",
};

const infoLabel = {
  color: "#9ca3af",
  fontSize: "14px",
  margin: "0 0 4px",
};

const infoValue = {
  color: "#ffffff",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 16px",
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

