import type { Metadata } from "next";
import { FichaNoDisponible } from "@/components/ficha/no-disponible";

// "Este auto ya no está disponible" + parecidos, para el que llega a una ficha
// que ya no existe. NO es una URL pública: src/proxy.ts reescribe
// /autos/<slug viejo> acá con status 404 (el navegador sigue viendo
// /autos/<slug>); entrar directo redirige a /autos (paso 5 del proxy).
// ISR: se genera en la primera visita y queda en caché hasta el próximo aviso
// de gestión (tag "stock") o 10 min de respaldo.
// = REVALIDAR_STOCK_S (lib/supabase.ts): subir a 3600 cuando gestión confirme revalidate en alta/baja/vendido/precio/fotos/reservado
export const revalidate = 600;

export function generateStaticParams(): { slug: string }[] {
  return [];
}

export const metadata: Metadata = {
  title: "Auto no disponible | Titus Cars",
  robots: { index: false, follow: true },
};

export default async function FichaNoDisponiblePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <FichaNoDisponible slug={slug} />;
}
