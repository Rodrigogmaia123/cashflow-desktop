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

interface ResetPasswordEmailProps {
  resetUrl: string;
  expiresIn: string;
}

export function ResetPasswordEmail({
  resetUrl,
  expiresIn,
}: ResetPasswordEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Redefinir sua senha - Cashflow Pro</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Redefinir senha</Heading>

          <Text style={text}>
            Recebemos uma solicitação para redefinir a senha da sua conta no
            Cashflow Pro.
          </Text>

          <Text style={text}>
            Clique no botão abaixo para criar uma nova senha:
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={resetUrl}>
              Redefinir senha
            </Button>
          </Section>

          <Text style={text}>
            Este link expira em <strong>{expiresIn}</strong> e só pode ser
            usado uma vez.
          </Text>

          <Text style={warning}>
            Se você não solicitou esta alteração, ignore este email. Sua senha
            permanecerá a mesma.
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

const warning = {
  color: "#fbbf24",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "24px 0 16px",
  padding: "12px",
  backgroundColor: "#fbbf2415",
  borderRadius: "6px",
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

