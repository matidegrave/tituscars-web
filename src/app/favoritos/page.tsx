import type { Metadata } from "next";
import { ListaFavoritos } from "@/components/favoritos/lista-favoritos";

// Favoritos sin cuenta (tanda 40): la lista vive en el navegador
// (localStorage), así que la página es un cascarón que la arma del lado del
// cliente. Fuera de Google: noindex y fuera del sitemap.

export const metadata: Metadata = {
  title: "Mis favoritos",
  robots: { index: false, follow: true },
};

export default function FavoritosPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">Mis favoritos</h1>
      <ListaFavoritos />
    </div>
  );
}
