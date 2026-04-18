export default function HourlyChart({ data, units }) {
  const tempUnit = units === 'metric' ? '°C' : '°F';
  if (!data || data.length === 0) return null;

  // ── SVG layout constants ─────────────────────
  const W   = 860;
  const H   = 190;
  const PAD = { top: 36, right: 24, bottom: 54, left: 30 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top  - PAD.bottom;

  const temps  = data.map((d) => d.temp);
  const minT   = Math.min(...temps) - 3;
  const maxT   = Math.max(...temps) + 3;
  const range  = maxT - minT || 1;

  const xAt = (i) => PAD.left + (i / (data.length - 1)) * chartW;
  const yAt = (t) => PAD.top  + chartH - ((t - minT) / range) * chartH;

  const linePts = data.map((d, i) => `${xAt(i)},${yAt(d.temp)}`).join(' ');
  const areaPts = [
    `${xAt(0)},${PAD.top + chartH}`,
    ...data.map((d, i) => `${xAt(i)},${yAt(d.temp)}`),
    `${xAt(data.length - 1)},${PAD.top + chartH}`,
  ].join(' ');

  return (
    <div className="chart-container" id="hourly-chart">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="chart-svg"
        preserveAspectRatio="xMidYMid meet"
        aria-label="24-hour temperature chart"
      >
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="#3b82f6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
          </linearGradient>
          <filter id="lineglow">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Horizontal grid lines */}
        {[0, 0.33, 0.66, 1].map((t) => {
          const y = PAD.top + (1 - t) * chartH;
          return (
            <line
              key={t}
              x1={PAD.left} y1={y}
              x2={W - PAD.right} y2={y}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Area fill under the line */}
        <polygon points={areaPts} fill="url(#areaGrad)" />

        {/* Temperature line */}
        <polyline
          points={linePts}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#lineglow)"
        />

        {/* Data points with labels + icons */}
        {data.map((d, i) => {
          const cx = xAt(i);
          const cy = yAt(d.temp);
          return (
            <g key={i}>
              {/* Glow circle */}
              <circle cx={cx} cy={cy} r="8" fill="#3b82f6" fillOpacity="0.15" />
              {/* Main dot */}
              <circle cx={cx} cy={cy} r="4.5" fill="#3b82f6" stroke="#060b1a" strokeWidth="2" />

              {/* Temperature label above dot */}
              <text
                x={cx} y={cy - 12}
                textAnchor="middle"
                fill="#f1f5f9" fontSize="11" fontWeight="700"
                fontFamily="Inter, sans-serif"
              >
                {Math.round(d.temp)}{tempUnit}
              </text>

              {/* Weather icon below x-axis */}
              <image
                href={`https://openweathermap.org/img/wn/${d.icon}.png`}
                x={cx - 13} y={PAD.top + chartH + 4}
                width="26" height="26"
              />

              {/* Time label at bottom */}
              <text
                x={cx} y={H - 4}
                textAnchor="middle"
                fill="#64748b" fontSize="10"
                fontFamily="Inter, sans-serif"
              >
                {d.time}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
