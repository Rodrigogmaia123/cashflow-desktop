import { cn } from "@/lib/utils";

export const BRAND_ICON_SRC = "/brand/cashflow-icon.png";

type BrandMarkProps = {
  size?: number;
  className?: string;
  alt?: string;
};

export function BrandMark({
  size = 32,
  className,
  alt = "Cashflow",
}: BrandMarkProps) {
  return (
    <img
      src={BRAND_ICON_SRC}
      alt={alt}
      width={size}
      height={size}
      className={cn("rounded-lg object-cover shrink-0", className)}
    />
  );
}
