/**
 * Film-grain overlay for the whole shell. Fixed, pointer-events-none, ~4.5%
 * opacity SVG noise — sits above everything (incl. scene art) for the cinema
 * texture, but never interferes with interaction.
 */
const NOISE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'>
       <filter id='n'>
         <feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/>
         <feColorMatrix type='saturate' values='0'/>
       </filter>
       <rect width='100%' height='100%' filter='url(#n)'/>
     </svg>`,
  );

export function Grain() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100] opacity-[0.045] mix-blend-soft-light"
      style={{ backgroundImage: `url("${NOISE}")`, backgroundSize: "160px 160px" }}
    />
  );
}
