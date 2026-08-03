// Fixed precision keeps the server-rendered and client-hydrated markup
// byte-identical — raw floats can serialize with a different last digit
// between Node's and the browser's JS engine and trip a hydration warning.
function round(n: number) {
  return Math.round(n * 1000) / 1000;
}

export default function HeroFallback() {
  const cols = 12;
  const rows = 7;
  const nodes: { x: number; y: number }[] = [];
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = (i / (cols - 1)) * 100;
      const yBase = (j / (rows - 1)) * 100;
      const bend = Math.sin((i / (cols - 1)) * Math.PI) * 6;
      nodes.push({ x: round(x), y: round(yBase + bend * (j % 2 === 0 ? 1 : -0.4)) });
    }
  }

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
      <defs>
        <linearGradient id="hero-fallback-grad" x1="0" y1="0" x2="100" y2="100">
          <stop offset="0%" stopColor="#3C3F45" />
          <stop offset="55%" stopColor="#C6A159" />
          <stop offset="100%" stopColor="#E8D4A0" />
        </linearGradient>
      </defs>
      {nodes.map((n, i) => {
        const col = Math.floor(i / rows);
        const row = i % rows;
        const right = nodes[i + rows];
        const down = row < rows - 1 ? nodes[i + 1] : null;
        return (
          <g key={i}>
            {right && (
              <line
                x1={n.x}
                y1={n.y}
                x2={right.x}
                y2={right.y}
                stroke="url(#hero-fallback-grad)"
                strokeWidth="0.12"
                opacity="0.35"
              />
            )}
            {down && (
              <line
                x1={n.x}
                y1={n.y}
                x2={down.x}
                y2={down.y}
                stroke="url(#hero-fallback-grad)"
                strokeWidth="0.12"
                opacity="0.35"
              />
            )}
            <circle cx={n.x} cy={n.y} r="0.45" fill="#E8D4A0" opacity="0.85" />
          </g>
        );
      })}
    </svg>
  );
}
