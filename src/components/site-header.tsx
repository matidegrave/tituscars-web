"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { linkWhatsappSegunRuta } from "@/lib/whatsapp";
import { MenuMovil } from "@/components/menu-movil";
import { ContadorFavoritos } from "@/components/favoritos/contador-favoritos";
import { BuscadorHeader } from "@/components/buscador-header";

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/autos", label: "Catálogo" },
  { href: "/consigna", label: "Consigná tu auto" },
  { href: "/financiacion", label: "Financiación" },
  { href: "/nosotros", label: "Conocenos" },
  { href: "/contacto", label: "Contacto" },
];

function esActivo(pathname: string, href: string): boolean {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const [abierto, setAbierto] = useState(false);
  const pathname = usePathname();

  return (
    // Naranja sólido siempre, también al scrollear (tanda 48: se sacó el
    // efecto translúcido con blur de la tanda 15).
    <header className="sticky top-0 z-40 bg-brand">
      <div className="mx-auto flex h-[var(--header-h)] max-w-6xl items-center justify-between px-4">
        <div className="flex shrink-0 items-center gap-2">
          {/* El logo lleva al catálogo (tanda 47); "Inicio" sigue en el menú. */}
          <Link href="/autos" className="shrink-0">
            <Image
              src="/brand/logo-header.svg"
              alt="Titus Cars"
              width={136}
              height={40}
              loading="eager"
              className="h-8 w-auto lg:h-10"
            />
          </Link>
          {/* Lupa de la compu (tanda 50): el campo se despliega a su derecha. */}
          <BuscadorHeader variante="compu" className="hidden lg:block" />
        </div>

        {/* Con el buscador abierto, el menú de texto se oculta (el campo ocupa su lugar). */}
        <nav className="hidden items-center gap-6 lg:flex [header:has([data-buscador-header=compu][open])_&]:invisible">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={esActivo(pathname, link.href) ? "page" : undefined}
              className="text-sm font-medium text-white decoration-white decoration-2 underline-offset-8 transition-colors hover:text-white/80 aria-[current=page]:underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <ContadorFavoritos />
          <Button
            className="bg-white text-brand hover:bg-white/90"
            nativeButton={false}
            render={
              <a
                href={linkWhatsappSegunRuta(pathname)}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            WhatsApp
          </Button>
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <BuscadorHeader variante="celu" menuAbierto={abierto} onAbrir={() => setAbierto(false)} />
          <ContadorFavoritos />
          <button
            type="button"
            aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={abierto}
            className="flex h-10 w-10 items-center justify-center text-white lg:hidden"
            onClick={() => setAbierto((v) => !v)}
          >
            {abierto ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {abierto && (
        <MenuMovil links={NAV_LINKS} onCerrar={() => setAbierto(false)} />
      )}
    </header>
  );
}
