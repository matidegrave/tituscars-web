import Link from "next/link";
import Image from "next/image";
import { FooterWhatsapp } from "@/components/footer-whatsapp";
import {
  RESENAS_URL,
  INSTAGRAM_URL,
  TIKTOK_URL,
  YOUTUBE_URL,
  DIRECCION,
} from "@/lib/config";
import { InstagramIcon, YoutubeIcon, StarIcon, TikTokIcon } from "@/components/icons/social-icons";

export function SiteFooter() {
  const nombre = process.env.NEXT_PUBLIC_SITE_NAME ?? "Titus Cars";

  return (
    <footer className="border-t border-brand-black bg-brand-black text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Image
            src="/brand/logo-horizontal-blanco.svg"
            alt="Titus Cars"
            width={123}
            height={36}
            className="h-9 w-auto"
          />
          <p className="mt-4 text-sm text-white/70">{DIRECCION}</p>
          <FooterWhatsapp className="mt-1 block text-sm text-white/70 hover:text-brand" />
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-white/50">
            Navegación
          </p>
          <nav className="mt-3 flex flex-col gap-2 text-sm text-white/70">
            <Link href="/autos" className="hover:text-brand">
              Catálogo
            </Link>
            <Link href="/consigna" className="hover:text-brand">
              Consigná tu auto
            </Link>
            <Link href="/financiacion" className="hover:text-brand">
              Financiación
            </Link>
            <Link href="/nosotros" className="hover:text-brand">
              Nosotros
            </Link>
            <Link href="/contacto" className="hover:text-brand">
              Contacto
            </Link>
          </nav>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-white/50">
            Seguinos
          </p>
          <div className="mt-3 flex items-center gap-4">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-white hover:text-brand"
            >
              <InstagramIcon className="h-5 w-5" />
            </a>
            <a
              href={TIKTOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="text-white hover:text-brand"
            >
              <TikTokIcon className="h-5 w-5" />
            </a>
            <a
              href={YOUTUBE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="text-white hover:text-brand"
            >
              <YoutubeIcon className="h-5 w-5" />
            </a>
          </div>
          <a
            href={RESENAS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-brand"
          >
            <StarIcon className="h-4 w-4" />
            Ver reseñas en Google
          </a>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} {nombre}. Todos los derechos reservados.
      </div>
    </footer>
  );
}
