// Logos de marca a color para /links, como SVG inline (sin imágenes externas).

type IconProps = { className?: string };

/** Isologo de Titus (el símbolo solo): disco con el símbolo calado, en currentColor. */
export function TitusIsologo({ className }: IconProps) {
  return (
    <svg viewBox="406.57 232.92 377.79 377.79" fill="currentColor" className={className} aria-hidden="true">
      <path d="M 681.296875 421.496094 L 656.972656 445.820312 L 626.078125 414.703125 L 668.96875 371.804688 L 636.429688 339.265625 L 508.460938 467.234375 L 541 499.773438 L 584.199219 456.574219 L 615.097656 487.695312 L 587.339844 515.453125 C 561.570312 541.21875 519.792969 541.21875 494.023438 515.453125 C 468.253906 489.683594 468.253906 447.90625 494.023438 422.136719 L 587.980469 328.179688 C 613.75 302.410156 655.527344 302.410156 681.296875 328.179688 C 707.066406 353.949219 707.066406 395.726562 681.296875 421.496094 M 648.433594 520.484375 L 615.890625 487.945312 L 657.761719 446.070312 L 690.304688 478.613281 Z M 595.46875 234.921875 C 492.25 234.921875 408.570312 318.597656 408.570312 421.816406 C 408.570312 525.035156 492.25 608.710938 595.46875 608.710938 C 698.683594 608.710938 782.359375 525.035156 782.359375 421.816406 C 782.359375 318.597656 698.683594 234.921875 595.46875 234.921875" />
    </svg>
  );
}

/** Pin de Google Maps con sus colores. */
export function GoogleMapsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 92.3 132.3" className={className} aria-hidden="true">
      <path fill="#1a73e8" d="M60.2 2.2C55.8.8 51 0 46.1 0 32 0 19.3 6.4 10.8 16.5l21.8 18.3L60.2 2.2z" />
      <path fill="#ea4335" d="M10.8 16.5C4.1 24.5 0 34.9 0 46.1c0 8.7 1.7 15.7 4.6 22l28-33.3-21.8-18.3z" />
      <path fill="#4285f4" d="M46.2 28.5c9.8 0 17.7 7.9 17.7 17.7 0 4.3-1.6 8.3-4.2 11.4 0 0 13.9-16.6 27.5-32.7-5.6-10.8-15.3-19-27-22.7L32.6 34.8c3.3-3.8 8.1-6.3 13.6-6.3" />
      <path fill="#fbbc04" d="M46.2 63.8c-9.8 0-17.7-7.9-17.7-17.7 0-4.3 1.5-8.3 4.1-11.3l-28 33.3c4.8 10.6 12.8 19.2 21 29.9l34.1-40.5c-3.3 3.9-8.1 6.3-13.5 6.3" />
      <path fill="#34a853" d="M59.1 109.2c15.4-24.1 33.3-35 33.3-63 0-7.7-1.9-14.9-5.2-21.3L25.6 98c2.6 3.4 5.3 7.3 7.9 11.3 9.4 14.5 6.8 23.1 12.8 23.1s3.4-8.7 12.8-23.2" />
    </svg>
  );
}

/** Instagram con el degradé oficial (amarillo -> naranja -> rosa -> violeta). */
export function InstagramColorIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="ig-degrade" x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FEDA75" />
          <stop offset="0.3" stopColor="#FA7E1E" />
          <stop offset="0.6" stopColor="#D62976" />
          <stop offset="0.85" stopColor="#962FBF" />
          <stop offset="1" stopColor="#4F5BD5" />
        </linearGradient>
      </defs>
      <rect x="2.9" y="2.9" width="18.2" height="18.2" rx="5.2" stroke="url(#ig-degrade)" strokeWidth={2} />
      <circle cx="12" cy="12" r="4.3" stroke="url(#ig-degrade)" strokeWidth={2} />
      <circle cx="17.4" cy="6.6" r="1.25" fill="url(#ig-degrade)" />
    </svg>
  );
}

const NOTA_TIKTOK =
  "M16.6 5.82c-1.02-.89-1.64-2.18-1.64-3.62h-3.12v14.24c0 1.53-1.25 2.78-2.78 2.78a2.78 2.78 0 0 1-2.78-2.78 2.78 2.78 0 0 1 2.78-2.78c.29 0 .57.04.83.13V10.6a5.9 5.9 0 0 0-.83-.06A5.9 5.9 0 0 0 3.16 16.44 5.9 5.9 0 0 0 9.06 22.3a5.9 5.9 0 0 0 5.9-5.86V9.03a8.24 8.24 0 0 0 4.82 1.55V7.46a5.15 5.15 0 0 1-3.18-1.64z";

/** TikTok: la nota negra con los bordes cian y rojo de la marca. */
export function TikTokColorIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d={NOTA_TIKTOK} fill="#25F4EE" transform="translate(-0.7 -0.7)" />
      <path d={NOTA_TIKTOK} fill="#FE2C55" transform="translate(0.7 0.7)" />
      <path d={NOTA_TIKTOK} fill="#000000" />
    </svg>
  );
}
