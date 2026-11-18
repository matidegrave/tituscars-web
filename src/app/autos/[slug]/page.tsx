import type { Metadata } from "next";
import { PaginaFicha, metadataFicha, paramsFicha } from "@/components/ficha/pagina-ficha";

// Ficha de un auto. La página es compartida con /motos/[slug]
// (components/ficha/pagina-ficha.tsx); una moto pedida acá va con 301 a
// /motos/<slug> (proxy) o, de respaldo, con 308 (la página).
// = REVALIDAR_STOCK_S (lib/supabase.ts): subir a 3600 cuando gestión confirme revalidate en alta/baja/vendido/precio/fotos/reservado
export const revalidate = 600;
export const dynamicParams = true;

export function generateStaticParams(): Promise<{ slug: string }[]> {
  return paramsFicha("autos");
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return metadataFicha((await params).slug);
}

export default async function FichaAutoPage({ params }: { params: Promise<{ slug: string }> }) {
  return <PaginaFicha slug={(await params).slug} seccion="autos" />;
}
