"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { linkWhatsapp } from "@/lib/whatsapp";
import { MenuMovil } from "@/components/menu-movil";

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/autos", label: "Catálogo" },
  { href: "/consigna", label: "Consigná tu auto" },
  { href: "/financiacion", label: "Financiación" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
];

function esActivo(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const [abierto, setAbierto] = useState(false);
  const pathname = usePathname();
  const header = useRef<HTMLElement>(null);

  // Arriba de todo, naranja pleno; al bajar pasa de a poco a translúcido
  // (opacidad del fondo de 100% a 65% entre 0 y 120 px). Se escribe una
  // variable CSS una vez por frame, sin re-renderizar ni trabar el scroll.
  // Respaldo: el CSS acota el porcentaje a 65–100% con clamp(), así el color
  // nunca queda inválido (ni transparente) aunque llegue un valor raro, y sin
  // color-mix el navegador usa el naranja pleno.
  useEffect(() => {
    const el = header.current;
    if (!el) return;
    let frame = 0;

    const actualizar = () => {
      frame = 0;
      // El rebote del iPhone arriba de todo da scrollY negativo: sin este
      // límite el porcentaje pasa de 100%, el color queda inválido y el fondo
      // se ve blanco.
      const scroll = Math.min(Math.max(window.scrollY, 0), 120);
      el.style.setProperty("--fondo-header", `${100 - (scroll / 120) * 35}%`);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(actualizar);
    };

    actualizar();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <header
      ref={header}
      className="sticky top-0 z-40 bg-[color-mix(in_srgb,var(--brand)_clamp(65%,var(--fondo-header,100%),100%),transparent)] backdrop-blur-md transition-[background-color] duration-300"
    >
      <div className="mx-auto flex h-[var(--header-h)] max-w-6xl items-center justify-between px-4">
        <Link href="/" className="shrink-0">
          <Image
            src="/brand/logo-header.svg"
            alt="Titus Cars"
            width={136}
            height={40}
            loading="eager"
            className="h-8 w-auto lg:h-10"
          />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
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

        <div className="hidden lg:block">
          <Button
            className="bg-white text-brand hover:bg-white/90"
            nativeButton={false}
            render={
              <a href={linkWhatsapp()} target="_blank" rel="noopener noreferrer" />
            }
          >
            WhatsApp
          </Button>
        </div>

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

      {abierto && <MenuMovil links={NAV_LINKS} onCerrar={() => setAbierto(false)} />}
    </header>
  );
}
