"use client";

import { usePathname } from "next/navigation";
import { TELEFONO_DISPLAY, WHATSAPP_CONSIGNAS, telefonoLegible } from "@/lib/config";
import { esRutaConsigna, linkWhatsappSegunRuta } from "@/lib/whatsapp";

/** Teléfono del footer: en /consigna, el WhatsApp de consignaciones. */
export function FooterWhatsapp({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <a
      href={linkWhatsappSegunRuta(pathname)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {esRutaConsigna(pathname) ? telefonoLegible(WHATSAPP_CONSIGNAS) : TELEFONO_DISPLAY}
    </a>
  );
}
