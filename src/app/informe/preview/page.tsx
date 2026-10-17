import type { Metadata } from "next";
import { VistaPrevia } from "@/components/informe/vista-previa";

// /informe/preview: la vista previa del informe en el panel de revisión del
// ERP (contrato cerrado: lib/informe-preview.ts). No tiene datos propios: no
// llama a informe_publico, no registra apertura y no recibe token; dibuja lo
// que manda el ERP por postMessage con el mismo InformeVista que la pública.
//
// Es la ÚNICA ruta que se puede embeber: next.config.ts la saca de la regla
// global (sin X-Frame-Options) y le pone una CSP aplicada con frame-ancestors
// = los orígenes del ERP. Dinámica para salir con Cache-Control private,
// no-store, como la pública.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vista previa del informe — Titus Cars",
  robots: { index: false, follow: false },
};

export default function PaginaVistaPrevia() {
  return <VistaPrevia />;
}
