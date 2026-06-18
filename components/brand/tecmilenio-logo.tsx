import Image from "next/image";
import { cn } from "@/components/ui/utils";

const BRAND_GREEN = "#00B364";

/** Filtro CSS para teñir el ícono blanco del PNG al verde institucional */
const ICON_GREEN_FILTER =
  "brightness(0) saturate(100%) invert(52%) sepia(89%) saturate(638%) hue-rotate(115deg) brightness(95%) contrast(101%)";

type TecmilenioLogoProps = {
  className?: string;
  /** Muestra el texto TECMILENIO en verde (ideal para fondos claros) */
  greenText?: boolean;
};

export function TecmilenioLogo({
  className,
  greenText = false,
}: TecmilenioLogoProps) {
  const textColor = greenText ? BRAND_GREEN : "#ffffff";

  return (
    <div
      className={cn("flex items-center gap-2.5", className)}
      role="img"
      aria-label="Tecmilenio"
    >
      <div className="relative h-8 w-[34px] shrink-0 overflow-hidden">
        <Image
          src="/tecmilenio.png"
          alt=""
          width={200}
          height={40}
          className="h-8 w-auto max-w-none object-left object-contain"
          style={{
            filter: greenText ? ICON_GREEN_FILTER : undefined,
          }}
          priority
        />
      </div>
      <span
        className="text-[1.05rem] font-bold tracking-[0.04em] leading-none"
        style={{ color: textColor }}
      >
        TECMILENIO
      </span>
    </div>
  );
}
