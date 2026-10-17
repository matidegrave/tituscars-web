import type { Metadata } from "next";
import { headers } from "next/headers";
import { after } from "next/server";
import { AvisoInforme, InformeVista } from "@/components/informe/informe-vista";
import { debeRegistrar, simular } from "@/lib/entorno";
import { leerResultado, TOKEN_INFORME } from "@/lib/informe";
import { supabase } from "@/lib/supabase";

// /informe/[token]: el informe de publicación que abre el consignante desde un
// link de WhatsApp (contrato: docs/informe-tanda-pagina-publica.md del repo de
// gestión). Sin el marco del sitio ni Pixel (layout: RUTAS_SIN_SITIO), sin
// cookies (el proxy no pone ninguna acá), fuera de Google (noindex y robots).
//
// Dinámica y sin caché (Cache-Control private, no-store): que ningún CDN sirva
// el informe de un cliente a otro por un error de clave.
export const dynamic = "force-dynamic";

const TITULO = "Informe de publicación — Titus Cars";

// Genérico a propósito: si el cliente reenvía el link, la previsualización de
// WhatsApp no muestra el auto ni la patente.
export const metadata: Metadata = {
  title: TITULO,
  description: "Informe de publicación de tu vehículo en Titus Cars.",
  robots: { index: false, follow: false },
  openGraph: {
    title: TITULO,
    description: "Informe de publicación de tu vehículo en Titus Cars.",
    type: "website",
    images: [{ url: "/brand/logo-horizontal@2x.png" }],
  },
};

const NO_ENCONTRADO = "No encontramos este informe.";
const VENCIDO = "Este informe corresponde a un período que ya pasó. Escribinos y te pasamos el actualizado.";

// Las previsualizaciones de links (WhatsApp, Telegram, Facebook…) y los
// crawlers no son una apertura del cliente.
const NO_PERSONAS = ["bot", "crawler", "spider", "preview", "facebookexternalhit", "meta-external", "whatsapp", "telegram", "slack", "discord", "skype", "linkedin", "twitter", "embedly"];

function esPersona(ua: string | null): boolean {
  const u = (ua ?? "").toLowerCase();
  return u !== "" && !NO_PERSONAS.some((b) => u.includes(b));
}

export default async function PaginaInforme({ params }: PageProps<"/informe/[token]">) {
  const { token } = await params;
  // Token con otra forma: ni se consulta la base.
  if (!TOKEN_INFORME.test(token)) return <AvisoInforme texto={NO_ENCONTRADO} />;

  const { data, error } = await supabase.rpc("informe_publico", { p_token: token });
  if (error) {
    console.error("[INFORME] informe_publico", error.message);
    return <AvisoInforme texto="No pudimos cargar el informe en este momento. Probá de nuevo en un rato." />;
  }

  const resultado = leerResultado(data);
  if (resultado.estado === "vencido") return <AvisoInforme texto={VENCIDO} />;
  if (resultado.estado !== "ok") return <AvisoInforme texto={NO_ENCONTRADO} />;

  // Apertura: una vez, después de responder, sin bloquear el render; si
  // falla, la página ya se mostró igual. Sólo en producción real, ni el
  // equipo (marca tc_equipo) ni las previsualizaciones cuentan.
  const h = await headers();
  if (esPersona(h.get("user-agent"))) {
    if (debeRegistrar({ headers: h })) {
      after(async () => {
        const { error: e } = await supabase.rpc("informe_registrar_apertura", { p_token: token });
        if (e) console.error("[INFORME] informe_registrar_apertura", e.message);
      });
    } else {
      simular("informe_registrar_apertura", { dominio: resultado.datos.dominio }, { headers: h });
    }
  }

  return <InformeVista informe={resultado} />;
}
