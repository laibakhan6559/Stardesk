const INK = '#1b2238'

export function PixelStar({ size = 28, className = '', style }) {
  return (
    <svg className={className} style={style} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <polygon
        points="12,2 15,9 22,9.5 16.5,14.5 18,22 12,18 6,22 7.5,14.5 2,9.5 9,9"
        fill="#ffd95e"
        stroke={INK}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Moon({ size = 70, className = '', style }) {
  return (
    <svg className={className} style={style} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path
        d="M44 6a28 28 0 1 0 14 40A24 24 0 0 1 44 6z"
        fill="#ffe27a"
        stroke={INK}
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Cloud({ x, y, s = 1 }) {
  const circles = [
    [14, 22, 11],
    [28, 14, 14],
    [44, 20, 12],
    [34, 26, 12],
    [20, 28, 9],
  ]
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g fill="#fff" stroke={INK} strokeWidth="3">
        {circles.map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} />
        ))}
      </g>
      <g fill="#fff">
        {circles.map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r - 0.8} />
        ))}
        <rect x="12" y="24" width="36" height="12" />
      </g>
    </g>
  )
}

export function Sky({ id, pole = false, clouds = false, label = 'Pastel pixel sky' }) {
  const gid = `sky-${id}`
  return (
    <svg className="sky-art" viewBox="0 0 240 130" role="img" aria-label={label} shapeRendering="crispEdges">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fb0f5" />
          <stop offset=".55" stopColor="#d9b5ee" />
          <stop offset="1" stopColor="#f7a8c9" />
        </linearGradient>
      </defs>
      <rect width="240" height="130" fill={`url(#${gid})`} />
      {[
        [30, 20],
        [70, 40],
        [190, 28],
        [150, 70],
        [212, 96],
        [100, 100],
        [20, 90],
        [128, 14],
      ].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="3" height="3" fill="#fff" opacity=".9" />
      ))}
      {pole && (
        <g>
          <path d="M0 40 Q60 62 120 46 T240 56" stroke="#fff" strokeWidth="2" fill="none" opacity=".9" />
          <path d="M0 52 Q60 74 120 58 T240 68" stroke="#fff" strokeWidth="2" fill="none" opacity=".9" />
          <rect x="118" y="30" width="8" height="100" fill="#fff" opacity=".95" />
          <rect x="100" y="38" width="44" height="5" fill="#fff" opacity=".95" />
        </g>
      )}
      {clouds && (
        <g>
          <Cloud x={14} y={72} s={1.1} />
          <Cloud x={150} y={64} s={1.3} />
          <Cloud x={92} y={86} s={0.8} />
        </g>
      )}
    </svg>
  )
}

const FOLDER_FILL = {
  blank: 'var(--folder-front)',
  lines: 'url(#pat-lines)',
  grid: 'url(#pat-grid)',
  dots: 'url(#pat-dots)',
}

export function Folder({ kind = 'blank' }) {
  return (
    <svg className="folder-art" viewBox="0 0 72 60" aria-hidden="true">
      <defs>
        <pattern id="pat-lines" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" style={{ fill: 'var(--folder-pat)' }} />
          <rect y="4" width="8" height="2.4" fill="#fff" />
        </pattern>
        <pattern id="pat-grid" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" style={{ fill: 'var(--folder-pat)' }} />
          <path d="M0 0H8M0 0V8" stroke="#fff" strokeWidth="1.4" />
        </pattern>
        <pattern id="pat-dots" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" style={{ fill: 'var(--folder-pat)' }} />
          <rect x="3" y="3" width="2" height="2" fill="#fff" />
        </pattern>
      </defs>
      <path d="M4 10 Q4 6 8 6 H26 L32 12 H62 Q66 12 66 16 V48 Q66 52 62 52 H8 Q4 52 4 48 Z" style={{ fill: 'var(--folder-back)' }} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M2 24 Q2 20 6 20 H66 Q70 20 69 24 L66 48 Q65 53 61 53 H8 Q4 53 3 48 Z" style={{ fill: FOLDER_FILL[kind] }} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
    </svg>
  )
}

export function Decor() {
  return (
    <div className="decor" aria-hidden="true">
      <PixelStar size={34} className="d d1" />
      <PixelStar size={22} className="d d2" />
      <PixelStar size={28} className="d d3" />
      <Moon size={76} className="d d4" />
    </div>
  )
}