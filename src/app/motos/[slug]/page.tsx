import type { Metadata } from "next";
import { PaginaFicha, metadataFicha, paramsFicha } from "@/components/ficha/pagina-ficha";

// Ficha de una moto (WEB-MOTOS2): la misma página que /autos/[slug]
// (components/ficha/pagina-ficha.tsx). Un auto pedido acá va a /autos/<slug>.
// = REVALIDAR_STOCK_S (lib/supabase.ts)
export const revalidate = 600;
export const dynamicParams = true;

export function generateStaticParams(): Promise<{ slug: string }[]> {
  return paramsFicha("motos");
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return metadataFicha((await params).slug);
}

export default async function FichaMotoPage({ params }: { params: Promise<{ slug: string }> }) {
  return <PaginaFicha slug={(await params).slug} seccion="motos" />;
}
