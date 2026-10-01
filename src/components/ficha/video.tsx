"use client";

import { useState } from "react";
import { extraerIdYoutube } from "@/lib/youtube";

/**
 * Video de YouTube con "fachada": al entrar se ve sólo la miniatura (lazy) y
 * un botón de play; el iframe (~1 MB de JS de YouTube) se monta recién al
 * tocarlo. Sin JS, la miniatura es un link al video en YouTube.
 */
export function VideoSection({ videoUrl }: { videoUrl: string | null }) {
  const [reproducir, setReproducir] = useState(false);
  if (!videoUrl) return null;

  const id = extraerIdYoutube(videoUrl);

  return (
    <div>
      <h2 className="text-lg font-bold">Video</h2>
      {id ? (
        // Celu: de borde a borde y sin el marco de las tarjetas, para que no se
        // confunda con otro auto.
        <div className="relative -mx-4 mt-4 aspect-video overflow-hidden bg-black sm:mx-0 sm:rounded-xl">
          {reproducir ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
              title="Video del auto"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          ) : (
            <a
              href={`https://www.youtube.com/watch?v=${id}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                setReproducir(true);
              }}
              aria-label="Reproducir el video del auto"
              className="group absolute inset-0 block"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- miniatura de YouTube tal cual, sin pasar por el optimizador */}
              <img
                src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-12 w-[68px] items-center justify-center rounded-xl bg-[#ff0000] shadow-lg transition-transform group-hover:scale-105">
                  <svg viewBox="0 0 24 24" className="ml-0.5 h-6 w-6 fill-white" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </span>
            </a>
          )}
        </div>
      ) : (
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm font-semibold text-foreground underline underline-offset-2 hover:text-brand"
        >
          Ver video
        </a>
      )}
    </div>
  );
}
