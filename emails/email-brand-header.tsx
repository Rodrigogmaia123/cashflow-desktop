import { Img, Section } from "@react-email/components";
import * as React from "react";

export function EmailBrandHeader() {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
    /\/$/,
    ""
  );

  return (
    <Section style={wrap}>
      <Img
        src={`${appUrl}/brand/cashflow-icon.png`}
        width="56"
        height="56"
        alt="Cashflow"
        style={icon}
      />
    </Section>
  );
}

const wrap = {
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const icon = {
  borderRadius: "12px",
  display: "inline-block",
};
