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

interface WelcomeEmailProps {
  name: string;
  loginUrl: string;
}

export function WelcomeEmail({ name, loginUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Bem-vindo ao Cashflow Pro! 🎉</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Bem-vindo ao Cashflow Pro, {name}! 🎉</Heading>

          <Text style={text}>
            Estamos muito felizes em tê-lo conosco. O Cashflow Pro foi criado
            para ajudar você a ter controle total sobre suas finanças e
            otimizar o fluxo de caixa do seu negócio.
          </Text>

          <Text style={text}>
            Com nossa plataforma, você pode:
          </Text>

          <Text style={listItem}>
            • Acompanhar receitas e despesas em tempo real
          </Text>
          <Text style={listItem}>
            • Analisar o desempenho de suas ofertas
          </Text>
          <Text style={listItem}>
            • Obter insights valiosos sobre a saúde financeira do seu negócio
          </Text>
          <Text style={listItem}>
            • Tomar decisões baseadas em dados concretos
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={loginUrl}>
              Acessar meu painel
            </Button>
          </Section>

          <Text style={text}>
            Se você tiver alguma dúvida, nossa equipe está sempre pronta para
            ajudar. Basta entrar em contato através do suporte.
          </Text>

          <Text style={text}>
            Mais uma vez, seja bem-vindo e aproveite ao máximo o Cashflow Pro!
          </Text>

          <Text style={footer}>
            Atenciosamente,
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

