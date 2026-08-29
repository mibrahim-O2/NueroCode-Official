// Hand-placed constellation of nodes and connecting lines, filling the
// hero's upper and right area — directly addressing "too much empty
// space" and "the right/upper area feels static." Pure SVG + CSS
// keyframes (see landing.css .l-network-node / .l-network-line), no
// canvas, no JS animation loop, no particle library — deterministic
// and cheap to render, safe for a live demo on any machine.

const NODES = [
  { x: 40, y: 30, r: 3, color: 'var(--l-orange)' },
  { x: 140, y: 15, r: 2.4, color: 'var(--l-teal)' },
  { x: 230, y: 55, r: 3.6, color: 'var(--l-orange)' },
  { x: 320, y: 20, r: 2.6, color: 'var(--l-teal)' },
  { x: 400, y: 60, r: 3, color: 'var(--l-orange)' },
  { x: 480, y: 25, r: 2.4, color: 'var(--l-teal)' },
  { x: 560, y: 70, r: 3.4, color: 'var(--l-orange)' },
  { x: 610, y: 40, r: 2.6, color: 'var(--l-teal)' },
  { x: 60, y: 130, r: 2.6, color: 'var(--l-teal)' },
  { x: 180, y: 150, r: 3, color: 'var(--l-orange)' },
  { x: 560, y: 150, r: 3, color: 'var(--l-teal)' },
  { x: 610, y: 190, r: 2.6, color: 'var(--l-orange)' },
  { x: 30, y: 230, r: 2.4, color: 'var(--l-orange)' },
  { x: 590, y: 260, r: 3.2, color: 'var(--l-teal)' },
  { x: 550, y: 340, r: 2.6, color: 'var(--l-orange)' },
  { x: 610, y: 380, r: 2.4, color: 'var(--l-teal)' },
  { x: 40, y: 340, r: 2.6, color: 'var(--l-teal)' },
  { x: 90, y: 400, r: 2.2, color: 'var(--l-orange)' },
];

const LINES = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7],
  [0, 8], [8, 9], [2, 9], [5, 10], [10, 6], [6, 11], [7, 11],
  [10, 13], [13, 14], [14, 15], [8, 12], [12, 16], [16, 17],
];

export default function HeroNetwork({ className = '' }) {
  return (
    <svg
      viewBox="0 0 640 440"
      className={`pointer-events-none absolute ${className}`}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      <g fill="none" strokeWidth="1">
        {LINES.map(([a, b], i) => {
          const from = NODES[a];
          const to = NODES[b];
          return (
            <line
              key={i}
              x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke={from.color}
              className="l-network-line"
              style={{ animationDelay: `${(i % 6) * 0.5}s, ${(i % 5) * 0.4}s` }}
            />
          );
        })}
      </g>
      <g>
        {NODES.map((n, i) => (
          <circle
            key={i}
            cx={n.x} cy={n.y} r={n.r}
            fill={n.color}
            className="l-network-node"
            style={{ color: n.color, animationDelay: `${(i % 7) * 0.35}s` }}
          />
        ))}
      </g>
    </svg>
  );
}