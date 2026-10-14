"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { guardarUtmDeLaUrl } from "@/lib/utm";

/** Montado una vez en el layout: guarda los utm de la URL al entrar y en cada navegación. */
export function CapturaUtm() {
  const pathname = usePathname();
  useEffect(() => {
    guardarUtmDeLaUrl();
  }, [pathname]);
  return null;
}
