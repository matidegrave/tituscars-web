"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { COOKIE_EQUIPO, UN_ANIO_S, esEquipoCliente } from "@/lib/equipo";

const CLAVE_OCULTA = "tc_equipo_etiqueta_oculta";
const RUTA_FICHA = /^\/autos\/[^/]+$/;

/**
 * Sincroniza la marca de equipo (lib/equipo.ts) entre la cookie y el respaldo
 * de localStorage, y muestra "Modo equipo · no se cuenta" abajo a la
 * izquierda. La X esconde la etiqueta; la marca sigue.
 */
export function ModoEquipo() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const cookie = document.cookie;
      if (new RegExp(`(?:^|;\\s*)${COOKIE_EQUIPO}=0(?:;|$)`).test(cookie)) {
        // ?equipo=0: se borra todo.
        localStorage.removeItem(COOKIE_EQUIPO);
        localStorage.removeItem(CLAVE_OCULTA);
        document.cookie = `${COOKIE_EQUIPO}=; Max-Age=0; Path=/; SameSite=Lax; Secure`;
      } else if (new RegExp(`(?:^|;\\s*)${COOKIE_EQUIPO}=1(?:;|$)`).test(cookie)) {
        localStorage.setItem(COOKIE_EQUIPO, "1");
      } else if (localStorage.getItem(COOKIE_EQUIPO) === "1") {
        // Se borró la cookie pero quedó el respaldo: se vuelve a poner.
        document.cookie = `${COOKIE_EQUIPO}=1; Max-Age=${UN_ANIO_S}; Path=/; SameSite=Lax; Secure`;
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(esEquipoCliente() && localStorage.getItem(CLAVE_OCULTA) !== "1");
    } catch {
      // localStorage bloqueado: queda sólo la cookie.
    }
  }, []);

  if (!visible) return null;

  // En la ficha del celu abajo está la barra de precio: la etiqueta va arriba de ella.
  const enFicha = RUTA_FICHA.test(pathname);
  return (
    <div
      className={`fixed left-2 z-[45] flex items-center gap-1 rounded-full bg-black/75 py-1 pl-3 pr-1 text-xs font-medium text-white shadow ${enFicha ? "bottom-[76px] sm:bottom-2" : "bottom-2"}`}
    >
      Modo equipo · no se cuenta
      <button
        type="button"
        aria-label="Esconder la etiqueta de modo equipo"
        onClick={() => {
          try {
            localStorage.setItem(CLAVE_OCULTA, "1");
          } catch {
            // sin localStorage: se esconde sólo hasta recargar
          }
          setVisible(false);
        }}
        className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/20"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
