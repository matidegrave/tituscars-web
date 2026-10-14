"use client";

import { usePathname } from "next/navigation";
import { WHATSAPP_CONSIGNAS, telefonoLegible } from "@/lib/config";
import { esRutaConsigna, linkWhatsappSegunRuta } from "@/lib/whatsapp";
import { useNumeroVentas } from "@/components/linea-whatsapp";

/**
 * Teléfono del footer: en /consigna, el WhatsApp de consignaciones; en el
 * resto, el de venta de esta visita (pauta o portales), link y número a la vez.
 */
export function FooterWhatsapp({ className }: { className?: string }) {
  const pathname = usePathname();
  const numeroVentas = useNumeroVentas();
  return (
    <a
      href={linkWhatsappSegunRuta(pathname, numeroVentas)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {telefonoLegible(esRutaConsigna(pathname) ? WHATSAPP_CONSIGNAS : numeroVentas)}
    </a>
  );
}
