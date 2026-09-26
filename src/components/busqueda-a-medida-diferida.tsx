"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import dynamic from "next/dynamic";

// El formulario va al pie de la ficha: su JS (form + inputs de Base UI) se
// descarga recién cuando el usuario se acerca (800 px antes de verlo), no en
// la carga de la página.
const BusquedaAMedida = dynamic(
  () => import("@/components/busqueda-a-medida").then((m) => m.BusquedaAMedida),
  { ssr: false, loading: () => <Reserva /> }
);

/** Lugar reservado mientras tanto (misma caja y alto aproximado del form). */
function Reserva() {
  return <div aria-hidden="true" className="min-h-[980px] rounded-2xl bg-brand-light sm:min-h-[640px]" />;
}

export function BusquedaAMedidaDiferida({
  className,
  ...props
}: ComponentProps<typeof BusquedaAMedida>) {
  const caja = useRef<HTMLDivElement>(null);
  const [cerca, setCerca] = useState(false);

  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada?.isIntersecting) {
          setCerca(true);
          observador.disconnect();
        }
      },
      { rootMargin: "800px 0px" }
    );
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  return (
    <div ref={caja} className={className}>
      {cerca ? <BusquedaAMedida {...props} /> : <Reserva />}
    </div>
  );
}
