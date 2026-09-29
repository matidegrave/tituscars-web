"use client";

import { useState } from "react";
import { Images, Play } from "lucide-react";
import { urlEmbed, urlInstagram, type VideoInstagram } from "@/lib/historia";
import { cn } from "@/lib/utils";

/**
 * Reel de Instagram que se reproduce dentro de la página (tanda 44).
 * Arranca como una fachada liviana (nada de Instagram se descarga): una
 * tarjeta 9:16 con play. Al tocarla se cambia por el iframe de /embed/ (sin
 * embed.js, que es pesado). Sin JS, la fachada es un link al reel.
 * Abajo, siempre, "¿No carga? Verlo en Instagram": los reels con música con
 * derechos a veces no se reproducen embebidos.
 */
export function ReelEmbed({ video, fecha, className }: { video: VideoInstagram; fecha?: string; className?: string }) {
  const [abierto, setAbierto] = useState(false);
  const url = urlInstagram(video);
  return (
    <div className={cn("w-full max-w-[340px]", className)}>
      {abierto ? (
        <iframe
          src={urlEmbed(video)}
          title={`Video de Titus Cars en Instagram${fecha ? ` (${fecha})` : ""}`}
          allow="autoplay; encrypted-media; picture-in-picture; clipboard-write"
          allowFullScreen
          loading="lazy"
          className="block aspect-[9/17] w-full max-w-[400px] rounded-2xl border border-border bg-white"
        />
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.preventDefault();
            setAbierto(true);
          }}
          aria-label={`${video.t === "p" ? "Ver la foto" : "Ver el video"}${fecha ? ` de ${fecha}` : ""}`}
          className="group relative flex aspect-[9/16] w-full flex-col items-center justify-center overflow-hidden rounded-2xl bg-[linear-gradient(160deg,var(--brand)_0%,#b83a00_55%,var(--brand-black)_100%)] text-white shadow-sm"
        >
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 ring-2 ring-white/70 transition-transform group-hover:scale-105">
            {video.t === "p" ? (
              <Images className="h-10 w-10" aria-hidden="true" />
            ) : (
              <Play className="ml-1 h-10 w-10 fill-white" aria-hidden="true" />
            )}
          </span>
          {fecha && <span className="mt-4 text-lg font-bold">{fecha}</span>}
          <span className="mt-1 text-sm text-white/85">{video.t === "p" ? "Toca para ver la foto" : "Toca para ver"}</span>
        </a>
      )}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1.5 inline-block text-xs text-muted-foreground hover:text-foreground"
      >
        ¿No carga? Verlo en Instagram
      </a>
    </div>
  );
}
