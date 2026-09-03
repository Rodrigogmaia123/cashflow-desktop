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

interface WorkspaceInviteEmailProps {
  workspaceName: string;
  inviterName: string;
  inviterEmail: string;
  role: string;
  acceptUrl: string;
  expiresIn: string;
}

export function WorkspaceInviteEmail({
  workspaceName,
  inviterName,
  inviterEmail,
  role,
  acceptUrl,
  expiresIn,
}: WorkspaceInviteEmailProps) {
  const roleLabels: Record<string, string> = {
    OWNER: "Proprietário",
    ADMIN: "Administrador",
    MEMBER: "Membro",
    VIEWER: "Visualizador",
  };

  return (
    <Html>
      <Head />
      <Preview>
        {inviterName || inviterEmail} convidou você para participar do workspace "{workspaceName}" no Cashflow Pro
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Convite para Workspace 🎯</Heading>

          <Text style={text}>
            <strong>{inviterName || inviterEmail}</strong> convidou você para participar do workspace <strong>"{workspaceName}"</strong> no Cashflow Pro.
          </Text>

          <Text style={text}>
            Você foi convidado com a permissão de <strong>{roleLabels[role] || role}</strong>.
          </Text>

          <Section style={infoBox}>
            <Text style={infoText}>
              <strong>Workspace:</strong> {workspaceName}
            </Text>
            <Text style={infoText}>
              <strong>Permissão:</strong> {roleLabels[role] || role}
            </Text>
            <Text style={infoText}>
              <strong>Convidado por:</strong> {inviterName || inviterEmail}
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={acceptUrl}>
              Aceitar Convite
            </Button>
          </Section>

          <Text style={text}>
            Este convite expira em <strong>{expiresIn}</strong>. Clique no botão acima para aceitar e começar a colaborar.
          </Text>

          <Text style={text}>
            Se você não esperava este convite, pode ignorar este email com segurança.
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

const infoBox = {
  backgroundColor: "#2a2a2a",
  borderRadius: "6px",
  padding: "20px",
  margin: "24px 0",
  border: "1px solid #3a3a3a",
};

const infoText = {
  color: "#e0e0e0",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0 0 8px",
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

