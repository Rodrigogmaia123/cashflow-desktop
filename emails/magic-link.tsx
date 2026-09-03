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

interface MagicLinkEmailProps {
  loginUrl: string;
  expiresIn: string;
}

export function MagicLinkEmail({
  loginUrl,
  expiresIn,
}: MagicLinkEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Seu link de acesso - Cashflow Pro</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Acesso rápido ao Cashflow Pro</Heading>

          <Text style={text}>
            Clique no botão abaixo para fazer login na sua conta:
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={loginUrl}>
              Entrar agora
            </Button>
          </Section>

          <Text style={text}>
            Este link expira em <strong>{expiresIn}</strong> e só pode ser usado
            uma vez.
          </Text>

          <Text style={text}>
            Se você não solicitou este link, ignore este email.
          </Text>

          <Text style={footer}>
            Por segurança, nunca compartilhe este link com outras pessoas.
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

