// Spiral circuit traces radiating from the logo's ring into small
// labeled "chip" endpoints, plus dual counter-rotating rings and an
// orbiting halo of code tokens. Left/right mirrored to match the
// logo's own orange/teal hemisphere symmetry. Coordinate system stays
// at 640x440 to remain a drop-in replacement — no other file needs to
// change. Reduced-motion is handled entirely via the CSS @media block
// at the bottom (no JS-level hook needed — that block already fully
// disables every animation here).

const CENTER = { x: 325, y: 190 };
const RING_INNER = 90;
const RING_OUTER = 125;
const CHIP_OFFSET = 150;

const LEFT_ANGLES = [213, 194, 175, 155, 137];
const LEFT_GLYPHS = ['{', ';', '}', '#', '0'];
const RIGHT_GLYPHS = ['<', '/', '>', '01', '1'];
const HALO_TOKENS = ['{ }', '</>', '=>', '01', ';', '&&'];

function polar(r, angleDeg) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: CENTER.x + r * Math.cos(a), y: CENTER.y + r * Math.sin(a) };
}

function buildTrace(angleDeg, glyph, color, mirror) {
  const a = mirror ? 180 - angleDeg : angleDeg;
  const entry = polar(RING_INNER, a);
  const chipRaw = polar(RING_INNER + CHIP_OFFSET, a);
  const chip = { x: mirror ? Math.min(chipRaw.x, 620) : Math.max(chipRaw.x, 20), y: Math.min(Math.max(chipRaw.y, 20), 420) };

  const rad = (a * Math.PI) / 180;
  const tangent = { x: -Math.sin(rad), y: Math.cos(rad) };
  const ctrl1 = { x: chip.x + (CENTER.x > chip.x ? 1 : -1) * 40, y: chip.y };
  const ctrl2 = { x: entry.x - tangent.x * 22, y: entry.y - tangent.y * 22 };
  const d = `M${chip.x},${chip.y} C${ctrl1.x},${ctrl1.y} ${ctrl2.x},${ctrl2.y} ${entry.x},${entry.y}`;

  return { glyph, chip, entry, color, d };
}

const TRACES = [
  ...LEFT_ANGLES.map((a, i) => buildTrace(a, LEFT_GLYPHS[i], 'var(--l-orange)', false)),
  ...LEFT_ANGLES.map((a, i) => buildTrace(a, RIGHT_GLYPHS[i], 'var(--l-teal)', true)),
];

const HALO = HALO_TOKENS.concat(HALO_TOKENS).map((token, i, arr) => {
  const angle = (360 / arr.length) * i;
  const p = polar(RING_OUTER + 25, angle);
  return { ...p, token, color: Math.cos((angle * Math.PI) / 180) >= 0 ? 'var(--l-teal)' : 'var(--l-orange)' };
});

const PULSE_TRACES = [TRACES[2], TRACES[7]];

export default function HeroNetwork({ className = '' }) {
  return (
    <svg
      viewBox="0 0 640 440"
      className={`pointer-events-none absolute ${className}`}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <filter id="hnGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <radialGradient id="hnCoreGlow">
          <stop offset="0%" stopColor="var(--l-orange)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--l-orange)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <style>{`
        .hn-spin-cw { animation: hnRotateCW linear infinite; transform-origin: ${CENTER.x}px ${CENTER.y}px; transform-box: view-box; }
        .hn-spin-ccw { animation: hnRotateCCW linear infinite; transform-origin: ${CENTER.x}px ${CENTER.y}px; transform-box: view-box; }
        @keyframes hnRotateCW { to { transform: rotate(360deg); } }
        @keyframes hnRotateCCW { to { transform: rotate(-360deg); } }
        .hn-core-pulse { animation: hnCorePulse 5s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
        @keyframes hnCorePulse { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 0.85; transform: scale(1.12); } }
        .hn-trace-flow { animation: hnTraceFlow 2.4s linear infinite; }
        @keyframes hnTraceFlow { to { stroke-dashoffset: -60; } }
        .hn-entry-pulse { animation: hnEntryPulse 2.4s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
        @keyframes hnEntryPulse { 0%, 100% { opacity: 0.55; transform: scale(1); } 50% { opacity: 0.1; transform: scale(1.9); } }
        .hn-halo-token { animation: hnTokenFade 3.6s ease-in-out infinite; }
        @keyframes hnTokenFade { 0%, 100% { opacity: 0.35; } 50% { opacity: 0.8; } }
        @media (prefers-reduced-motion: reduce) {
          .hn-spin-cw, .hn-spin-ccw, .hn-core-pulse, .hn-trace-flow, .hn-entry-pulse, .hn-halo-token { animation: none !important; }
        }
      `}</style>

      <circle cx={CENTER.x} cy={CENTER.y} r={RING_INNER * 0.7} fill="url(#hnCoreGlow)" className="hn-core-pulse" />

      <g fill="none">
        <circle cx={CENTER.x} cy={CENTER.y} r={RING_INNER} stroke="var(--l-orange)" strokeWidth="1" opacity="0.35" />
        <circle
          cx={CENTER.x} cy={CENTER.y} r={(RING_INNER + RING_OUTER) / 2}
          stroke="var(--l-teal)" strokeWidth="1" strokeDasharray="3 8" opacity="0.35"
          className="hn-spin-cw" style={{ animationDuration: '48s' }}
        />
        <circle
          cx={CENTER.x} cy={CENTER.y} r={RING_OUTER}
          stroke="var(--l-orange)" strokeWidth="1" strokeDasharray="1 12" opacity="0.3"
          className="hn-spin-ccw" style={{ animationDuration: '70s' }}
        />
      </g>

      <g fill="none" strokeWidth="1.4">
        {TRACES.map((t, i) => (
          <g key={i}>
            <path d={t.d} stroke={t.color} strokeWidth="2.5" opacity="0.22" filter="url(#hnGlow)" />
            <path d={t.d} stroke={t.color} opacity="0.85" strokeDasharray="6 12" strokeLinecap="round" className="hn-trace-flow" style={{ animationDelay: `${(i % 5) * 0.3}s` }} />
          </g>
        ))}
      </g>

      <g>
        {TRACES.map((t, i) => (
          <g key={i}>
            <circle cx={t.entry.x} cy={t.entry.y} r="3.6" fill={t.color} />
            <circle cx={t.entry.x} cy={t.entry.y} r="3.6" fill={t.color} className="hn-entry-pulse" style={{ animationDelay: `${(i % 5) * 0.35}s` }} />
          </g>
        ))}
      </g>

      <g fontFamily="monospace" fontSize="12" fontWeight="600">
        {TRACES.map((t, i) => (
          <g key={i} opacity="0.8">
            <rect x={t.chip.x - 12} y={t.chip.y - 12} width="24" height="24" rx="5" fill="none" stroke={t.color} strokeWidth="1.3" strokeDasharray="3 3" />
            <circle cx={t.chip.x} cy={t.chip.y} r="1.8" fill={t.color} />
            <text x={t.chip.x} y={t.chip.y - 18} textAnchor="middle" fill={t.color}>{t.glyph}</text>
          </g>
        ))}
      </g>

      <g className="hn-spin-cw" style={{ animationDuration: '60s' }}>
        {HALO.map((h, i) => (
          <g key={i} transform={`translate(${h.x},${h.y})`}>
            <g className="hn-spin-ccw" style={{ animationDuration: '60s', transformBox: 'fill-box', transformOrigin: 'center' }}>
              <text fontFamily="monospace" fontSize="10" fontWeight="600" fill={h.color} textAnchor="middle" className="hn-halo-token" style={{ animationDelay: `${(i % 6) * 0.4}s` }}>
                {h.token}
              </text>
            </g>
          </g>
        ))}
      </g>

      <g>
        {PULSE_TRACES.map((t, i) => (
          <circle key={i} r="2.4" fill={t.color}>
            <animateMotion dur={`${3 + i * 0.5}s`} repeatCount="indefinite" path={t.d} />
          </circle>
        ))}
      </g>
    </svg>
  );
}