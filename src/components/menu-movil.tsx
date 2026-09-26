"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { bloquearScroll, desbloquearScroll } from "@/lib/scroll-lock";
import { linkWhatsapp } from "@/lib/whatsapp";

/**
 * Menú del celu superpuesto a la página (no la empuja). Va por portal al
 * <body>: el header tiene backdrop-filter, que haría que un position:fixed
 * adentro se ubique respecto del header y no de la pantalla.
 * - Backdrop semitransparente que cierra al tocarlo.
 * - Scroll del body bloqueado (compatible con iOS).
 * - Cierra con Esc, al tocar un link y con el botón atrás del celu.
 * - Animación corta, sólo si el usuario no pidió reducir el movimiento.
 */
export function MenuMovil({
  links,
  onCerrar,
}: {
  links: { href: string; label: string }[];
  onCerrar: () => void;
}) {
  const porLink = useRef(false);
  const cerrar = useRef(onCerrar);
  useEffect(() => {
    cerrar.current = onCerrar;
  });

  useEffect(() => {
    bloquearScroll();

    // Botón atrás: abrir el menú suma una entrada al historial; volver atrás
    // lo cierra. Si se cierra de otra forma, se saca esa entrada (salvo que se
    // cierre por tocar un link: ahí la navegación ya está en marcha).
    window.history.pushState({ ...window.history.state, menuMovil: true }, "");
    const alVolver = () => cerrar.current();
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrar.current();
    };
    window.addEventListener("popstate", alVolver);
    window.addEventListener("keydown", alTeclear);

    return () => {
      window.removeEventListener("popstate", alVolver);
      window.removeEventListener("keydown", alTeclear);
      desbloquearScroll();
      if (!porLink.current && window.history.state?.menuMovil) window.history.back();
    };
  }, []);

  return createPortal(
    <div className="lg:hidden">
      <div
        aria-hidden
        onClick={() => cerrar.current()}
        className="fixed inset-x-0 bottom-0 top-[var(--header-h)] z-[60] bg-black/40 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200"
      />
      <nav
        aria-label="Menú"
        className="fixed inset-x-0 top-[var(--header-h)] z-[60] flex max-h-[calc(100dvh-var(--header-h))] flex-col gap-1 overflow-y-auto border-t border-border bg-background px-4 py-3 shadow-lg motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-200"
      >
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => {
              porLink.current = true;
              cerrar.current();
            }}
            className="rounded-md px-2 py-2.5 text-sm font-medium text-foreground/80 hover:bg-muted hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
        <Button
          className="mt-2 w-full"
          nativeButton={false}
          render={<a href={linkWhatsapp()} target="_blank" rel="noopener noreferrer" />}
        >
          WhatsApp
        </Button>
      </nav>
    </div>,
    document.body
  );
}
