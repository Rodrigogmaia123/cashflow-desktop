import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface PasswordChangedEmailProps {
  name: string;
  timestamp: string;
}

export function PasswordChangedEmail({
  name,
  timestamp,
}: PasswordChangedEmailProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const loginUrl = `${appUrl}/login`;

  return (
    <Html>
      <Head />
      <Preview>Senha alterada com sucesso - Cashflow Pro</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Senha alterada com sucesso</Heading>

          <Text style={text}>Olá, {name}!</Text>

          <Text style={text}>
            Sua senha foi alterada com sucesso em{" "}
            <strong>{timestamp}</strong>.
          </Text>

          <Text style={text}>
            Por segurança, você foi desconectado de todos os dispositivos. Faça
            login novamente com sua nova senha.
          </Text>

          <Section style={buttonContainer}>
            <a href={loginUrl} style={button}>
              Fazer login
            </a>
          </Section>

          <Text style={warning}>
            Se você não solicitou esta alteração, entre em contato conosco
            imediatamente através do suporte.
          </Text>

          <Text style={footer}>
            Por segurança, mantenha sua senha em local seguro e não compartilhe
            com outras pessoas.
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

