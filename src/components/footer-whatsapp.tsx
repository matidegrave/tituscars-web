"use client";

import { useRutaVisible } from "@/lib/ruta-visible";
import { WHATSAPP_CONSIGNAS, telefonoLegible } from "@/lib/config";
import { esRutaConsigna, linkWhatsappSegunRuta } from "@/lib/whatsapp";
import { useVenta } from "@/components/linea-whatsapp";

/**
 * Teléfono del footer: en /consigna, el WhatsApp de consignaciones; en el
 * resto, el de venta de esta visita (pauta o portales), link y número a la vez.
 */
export function FooterWhatsapp({ className }: { className?: string }) {
  const pathname = useRutaVisible();
  const venta = useVenta();
  return (
    <a
      href={linkWhatsappSegunRuta(pathname, venta)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {telefonoLegible(esRutaConsigna(pathname) ? WHATSAPP_CONSIGNAS : venta.numero)}
    </a>
  );
}
