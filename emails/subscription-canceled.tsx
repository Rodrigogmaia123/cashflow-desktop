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

interface SubscriptionCanceledEmailProps {
  plan: string;
  billingUrl: string;
}

export function SubscriptionCanceledEmail({
  plan,
  billingUrl,
}: SubscriptionCanceledEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Assinatura cancelada - Cashflow Pro</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Assinatura cancelada</Heading>

          <Text style={text}>
            Sua assinatura do plano <strong>{plan}</strong> foi cancelada.
          </Text>

          <Text style={text}>
            Você continuará tendo acesso aos recursos do plano {plan} até o fim
            do período atual. Após isso, sua conta será automaticamente
            rebaixada para o plano gratuito.
          </Text>

          <Text style={text}>
            Sentiremos sua falta! Se mudar de ideia, você pode reativar sua
            assinatura a qualquer momento.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={billingUrl}>
              Gerenciar assinatura
            </Button>
          </Section>

          <Text style={text}>
            Se você tiver alguma dúvida ou feedback, nossa equipe está sempre
            disponível para ajudar.
          </Text>

          <Text style={footer}>
            Obrigado por ter usado o Cashflow Pro!
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

