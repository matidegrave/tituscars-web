"use client";

import { usePathname } from "next/navigation";
import { linkWhatsappSegunRuta } from "@/lib/whatsapp";
import { WhatsappIcon } from "@/components/icons/whatsapp-icon";

const RUTA_FICHA = /^\/autos\/[^/]+$/;

export function WhatsappFloatingButton() {
  const pathname = usePathname();

  if (RUTA_FICHA.test(pathname)) {
    return null;
  }

  return (
    <a
      href={linkWhatsappSegunRuta(pathname, "Hola, ¿cómo estás? Quería hacer una consulta.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribinos por WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105"
    >
      <WhatsappIcon className="h-7 w-7" />
    </a>
  );
}
