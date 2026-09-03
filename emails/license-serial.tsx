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

export interface LicenseSerialEmailProps {
  editionLabel: string;
  durationLabel: string;
  serial: string;
  installerUrl: string | null;
  successUrl: string;
}

export function LicenseSerialEmail({
  editionLabel,
  durationLabel,
  serial,
  installerUrl,
  successUrl,
}: LicenseSerialEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Sua chave do {editionLabel} e o instalador</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Pagamento confirmado</Heading>

          <Text style={text}>
            Sua chave do {editionLabel} ({durationLabel}) está abaixo. O prazo
            só começa quando você ativar o serial no programa — não nesta
            compra.
          </Text>

          <Section style={serialBox}>
            <Text style={serialLabel}>Serial</Text>
            <Text style={serialValue}>{serial}</Text>
          </Section>

          <Text style={text}>
            Guarde esta chave. Ela vale para uma cópia do app. Pendrive da
            mesma instalação continua válido; clonar para outro computador
            não.
          </Text>

          {installerUrl ? (
            <Section style={buttonContainer}>
              <Button style={button} href={installerUrl}>
                Baixar o instalador
              </Button>
            </Section>
          ) : null}

          <Section style={buttonContainer}>
            <Button style={secondaryButton} href={successUrl}>
              Ver chave e download
            </Button>
          </Section>

          <Text style={footer}>
            Nexpay Vendas Online LTDA
            <br />
            CNPJ 44.681.882/0001-73
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

const serialBox = {
  backgroundColor: "#111111",
  border: "1px solid #333333",
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "8px 0 24px",
};

const serialLabel = {
  color: "#9ca3af",
  fontSize: "12px",
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  margin: "0 0 8px",
};

const serialValue = {
  color: "#c7f156",
  fontFamily:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  fontSize: "18px",
  fontWeight: "600" as const,
  letterSpacing: "0.04em",
  margin: "0",
};

const buttonContainer = {
  margin: "16px 0",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#c7f156",
  borderRadius: "6px",
  color: "#111111",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const secondaryButton = {
  backgroundColor: "#2a2a2a",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const footer = {
  color: "#9ca3af",
  fontSize: "13px",
  lineHeight: "1.6",
  margin: "32px 0 0",
};
