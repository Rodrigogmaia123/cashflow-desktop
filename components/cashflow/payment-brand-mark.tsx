import type { ReactNode } from "react";
import type { PaymentBrandId } from "@/lib/domain/payment";

type MarkProps = {
  brand: PaymentBrandId | string | null | undefined;
  size?: number;
  className?: string;
};

function Tile({
  size,
  bg,
  fg,
  children,
  className
}: {
  size: number;
  bg: string;
  fg: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md font-semibold leading-none ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        background: bg,
        color: fg,
        fontSize: Math.max(8, Math.round(size * 0.34))
      }}
      aria-hidden
    >
      {children}
    </span>
  );
}

export function PaymentBrandMark({ brand, size = 22, className }: MarkProps) {
  switch (brand) {
    case "nubank":
      return (
        <Tile size={size} bg="#820AD1" fg="#fff" className={className}>
          Nu
        </Tile>
      );
    case "inter":
      return (
        <Tile size={size} bg="#FF7A00" fg="#fff" className={className}>
          In
        </Tile>
      );
    case "c6":
      return (
        <Tile size={size} bg="#111111" fg="#F5F5F5" className={className}>
          C6
        </Tile>
      );
    case "banrisul":
      return (
        <Tile size={size} bg="#003DA5" fg="#F5C518" className={className}>
          Ba
        </Tile>
      );
    case "sicoob":
      return (
        <Tile size={size} bg="#00A859" fg="#fff" className={className}>
          Sc
        </Tile>
      );
    case "sicredi":
      return (
        <Tile size={size} bg="#3AAA35" fg="#fff" className={className}>
          Si
        </Tile>
      );
    case "itau":
      return (
        <Tile size={size} bg="#EC7000" fg="#fff" className={className}>
          It
        </Tile>
      );
    case "bradesco":
      return (
        <Tile size={size} bg="#CC092F" fg="#fff" className={className}>
          Br
        </Tile>
      );
    case "bb":
      return (
        <Tile size={size} bg="#FFCC00" fg="#0B2A5B" className={className}>
          BB
        </Tile>
      );
    case "caixa":
      return (
        <Tile size={size} bg="#0070AF" fg="#fff" className={className}>
          Cx
        </Tile>
      );
    case "santander":
      return (
        <Tile size={size} bg="#EC0000" fg="#fff" className={className}>
          Sa
        </Tile>
      );
    case "next":
      return (
        <Tile size={size} bg="#00D68F" fg="#06281C" className={className}>
          Nx
        </Tile>
      );
    case "picpay":
      return (
        <Tile size={size} bg="#21C25E" fg="#fff" className={className}>
          Pp
        </Tile>
      );
    case "mercadopago":
      return (
        <Tile size={size} bg="#009EE3" fg="#fff" className={className}>
          MP
        </Tile>
      );
    case "pagbank":
      return (
        <Tile size={size} bg="#FFC800" fg="#1A1A1A" className={className}>
          Pg
        </Tile>
      );
    case "cash":
      return (
        <Tile size={size} bg="#3F4A3A" fg="#D7F5C5" className={className}>
          $
        </Tile>
      );
    case "other":
      return (
        <Tile size={size} bg="#3F3F46" fg="#E4E4E7" className={className}>
          ··
        </Tile>
      );
    default:
      return (
        <Tile size={size} bg="#27272A" fg="#A1A1AA" className={className}>
          ?
        </Tile>
      );
  }
}
