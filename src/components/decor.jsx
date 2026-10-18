// Floating background decorations. Every colour theme gets its own little pixel-style set.
// <ThemeDecor theme="ocean" /> renders 4 items in the slots .d1 .d2 .d3 .d4 (see styles.css).

const INK = '#1b2238'

// Draws the shapes twice: once fat with an outline colour, once plain on top = clean outlined icon.
function Icon({ size, className = '', style, view = 64, ink = INK, children }) {
  return (
    <svg className={className} style={style} width={size} height={size} viewBox={`0 0 ${view} ${view}`} aria-hidden="true">
      <g stroke={ink} strokeWidth="6" strokeLinejoin="round" strokeLinecap="round">
        {children}
      </g>
      <g stroke="none">{children}</g>
    </svg>
  )
}

const Star = ({ fill = '#ffd95e', ...p }) => (
  <Icon {...p}>
    <polygon points="32,4 40,24 61,25 45,38 50,59 32,47 14,59 19,38 3,25 24,24" fill={fill} />
  </Icon>
)

const Moon = ({ fill = '#ffe27a', ...p }) => (
  <Icon {...p}>
    <path d="M44 6a28 28 0 1 0 14 40A24 24 0 0 1 44 6z" fill={fill} />
  </Icon>
)

const Sparkle = ({ fill = '#fff', ...p }) => (
  <Icon {...p}>
    <path d="M32 3 L39 25 L61 32 L39 39 L32 61 L25 39 L3 32 L25 25 Z" fill={fill} />
  </Icon>
)

const Bubble = ({ fill = '#d8f0ff', ...p }) => (
  <Icon {...p}>
    <circle cx="32" cy="32" r="24" fill={fill} fillOpacity="0.7" />
    <path d="M20 30 a13 13 0 0 1 10 -12" stroke="#fff" strokeWidth="5" fill="none" />
  </Icon>
)

const Fish = ({ fill = '#ff9f5a', ...p }) => (
  <Icon {...p}>
    <polygon points="44,32 61,17 61,47" fill={fill} />
    <ellipse cx="28" cy="32" rx="21" ry="14" fill={fill} />
    <circle cx="17" cy="29" r="3" fill={INK} stroke="none" />
  </Icon>
)

const Boat = ({ fill = '#fff', hull = '#2f7fd6', ...p }) => (
  <Icon {...p}>
    <polygon points="30,6 30,38 10,38" fill={fill} />
    <polygon points="35,14 35,38 54,38" fill={fill} />
    <polygon points="6,42 58,42 48,58 16,58" fill={hull} />
  </Icon>
)

const Leaf = ({ fill = '#5fd08a', ...p }) => (
  <Icon {...p}>
    <path d="M8 56 C8 22 28 8 58 8 C58 38 42 58 8 56 Z" fill={fill} />
    <path d="M10 54 L42 22" stroke={INK} strokeWidth="2.5" fill="none" />
  </Icon>
)

const Flower = ({ petal = '#ff9fc4', center = '#ffd95e', ...p }) => (
  <Icon {...p}>
    {[0, 72, 144, 216, 288].map((a) => (
      <circle key={a} cx={32 + 17 * Math.sin((a * Math.PI) / 180)} cy={32 - 17 * Math.cos((a * Math.PI) / 180)} r="12" fill={petal} />
    ))}
    <circle cx="32" cy="32" r="9" fill={center} />
  </Icon>
)

const Pine = ({ fill = '#3fae6a', trunk = '#8a5a34', ...p }) => (
  <Icon {...p}>
    <rect x="27" y="48" width="10" height="13" fill={trunk} />
    <polygon points="32,26 58,52 6,52" fill={fill} />
    <polygon points="32,15 54,38 10,38" fill={fill} />
    <polygon points="32,3 50,24 14,24" fill={fill} />
  </Icon>
)

const Sun = ({ fill = '#ffd34d', ray = '#ffb020', ...p }) => (
  <Icon {...p}>
    {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
      <rect key={a} x="29" y="2" width="6" height="12" rx="2" fill={ray} transform={`rotate(${a} 32 32)`} />
    ))}
    <circle cx="32" cy="32" r="16" fill={fill} />
  </Icon>
)

const Cloud = ({ fill = '#fff', ...p }) => (
  <Icon {...p}>
    <circle cx="18" cy="38" r="12" fill={fill} />
    <circle cx="32" cy="28" r="15" fill={fill} />
    <circle cx="46" cy="36" r="13" fill={fill} />
    <rect x="18" y="38" width="28" height="12" fill={fill} />
  </Icon>
)

const Cactus = ({ fill = '#5cbf7a', ...p }) => (
  <Icon {...p}>
    <rect x="24" y="6" width="16" height="54" rx="8" fill={fill} />
    <rect x="6" y="22" width="10" height="22" rx="5" fill={fill} />
    <rect x="8" y="36" width="20" height="8" fill={fill} />
    <rect x="48" y="16" width="10" height="22" rx="5" fill={fill} />
    <rect x="36" y="30" width="18" height="8" fill={fill} />
  </Icon>
)

const Pyramid = ({ fill = '#e8c070', shade = '#c99a45', ...p }) => (
  <Icon {...p}>
    <polygon points="32,6 60,56 4,56" fill={fill} />
    <polygon points="32,6 60,56 32,56" fill={shade} />
  </Icon>
)

const Gem = ({ fill = '#8fd0f5', top = '#cdeeff', ...p }) => (
  <Icon {...p}>
    <polygon points="32,58 6,24 18,6 46,6 58,24" fill={fill} />
    <polygon points="6,24 18,6 46,6 58,24" fill={top} />
  </Icon>
)

const Gear = ({ fill = '#9aa3b2', ...p }) => (
  <Icon {...p}>
    {[0, 45, 90, 135].map((a) => (
      <rect key={a} x="26" y="3" width="12" height="58" rx="3" fill={fill} transform={`rotate(${a} 32 32)`} />
    ))}
    <circle cx="32" cy="32" r="19" fill={fill} />
    <circle cx="32" cy="32" r="7" fill={INK} />
  </Icon>
)

const Hexagon = ({ fill = '#aab2c0', ...p }) => (
  <Icon {...p}>
    <polygon points="32,5 55,18 55,46 32,59 9,46 9,18" fill={fill} />
  </Icon>
)

const Square = ({ fill = '#c9ced8', ...p }) => (
  <Icon {...p}>
    <rect x="14" y="14" width="36" height="36" rx="4" fill={fill} transform="rotate(15 32 32)" />
  </Icon>
)

const Planet = ({ fill = '#8d7bff', ring = '#ff8fd0', ...p }) => (
  <Icon {...p}>
    <circle cx="32" cy="32" r="17" fill={fill} />
    <ellipse cx="32" cy="32" rx="29" ry="9" fill="none" stroke={ring} strokeWidth="4" transform="rotate(-22 32 32)" />
  </Icon>
)

const Flame = ({ fill = '#ff7a1a', inner = '#ffd34d', ...p }) => (
  <Icon {...p}>
    <path d="M32 3 C38 18 55 26 51 44 C49 54 41 61 32 61 C22 61 13 53 13 42 C13 31 22 27 24 16 C28 21 29 25 31 26 C33 19 30 11 32 3 Z" fill={fill} />
    <path d="M32 30 C36 38 43 40 41 48 C40 54 36 57 32 57 C27 57 23 53 23 47 C23 40 30 38 32 30 Z" fill={inner} />
  </Icon>
)

const Firefly = ({ size, className = '', style }) => (
  <svg className={className} style={style} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
    <circle cx="32" cy="32" r="28" fill="#c8ff7a" fillOpacity="0.2" />
    <circle cx="32" cy="32" r="16" fill="#c8ff7a" fillOpacity="0.35" />
    <circle cx="32" cy="32" r="7" fill="#f4ffc2" />
  </svg>
)

// slot sizes: d1 small top-right, d2 small bottom-left, d3 medium right (hidden < 1100px), d4 large left (hidden < 1100px)
const SETS = {
  pink: [
    [Star, 34, {}],
    [Star, 22, {}],
    [Star, 28, {}],
    [Moon, 76, {}],
  ],
  ocean: [
    [Bubble, 34, {}],
    [Bubble, 22, {}],
    [Fish, 44, {}],
    [Boat, 84, {}],
  ],
  forest: [
    [Leaf, 34, {}],
    [Leaf, 24, { fill: '#9be07a' }],
    [Flower, 40, {}],
    [Pine, 82, {}],
  ],
  sunset: [
    [Cloud, 40, {}],
    [Sun, 26, { fill: '#ffe27a' }],
    [Cloud, 46, { fill: '#fff4e6' }],
    [Sun, 84, {}],
  ],
  sand: [
    [Gem, 30, { fill: '#e8b25a', top: '#ffe0a0' }],
    [Cactus, 36, {}],
    [Pyramid, 44, {}],
    [Sun, 80, { fill: '#f2cf72', ray: '#d9a441' }],
  ],
  silver: [
    [Hexagon, 32, {}],
    [Gear, 26, { fill: '#b5bdca' }],
    [Gem, 36, { fill: '#aab4c4', top: '#e3e8ef' }],
    [Gear, 84, { fill: '#8d97a8' }],
  ],
  galaxy: [
    [Star, 34, {}],
    [Sparkle, 24, { fill: '#ffd9f0' }],
    [Star, 28, { fill: '#ffe9a8' }],
    [Planet, 86, {}],
  ],
  midnight: [
    [Sparkle, 32, { fill: '#dbe9ff' }],
    [Star, 22, { fill: '#cfe2ff' }],
    [Star, 28, { fill: '#ffe9a8' }],
    [Moon, 76, { fill: '#e6f0ff' }],
  ],
  emerald: [
    [Firefly, 40, {}],
    [Firefly, 28, {}],
    [Leaf, 34, { fill: '#3fcf86' }],
    [Pine, 84, { fill: '#2b9d62', trunk: '#6b4a2e' }],
  ],
  ember: [
    [Flame, 34, {}],
    [Sparkle, 22, { fill: '#ffb066' }],
    [Flame, 30, { fill: '#ff5a1a' }],
    [Flame, 80, {}],
  ],
  graphite: [
    [Star, 30, { fill: '#e4e6eb' }],
    [Square, 24, { fill: '#8e8e98' }],
    [Hexagon, 34, { fill: '#aeb2bc' }],
    [Moon, 76, { fill: '#c9ccd4' }],
  ],
}

export function ThemeDecor({ theme }) {
  const set = SETS[theme] || SETS.pink
  return (
    <div className="decor" aria-hidden="true">
      {set.map(([Comp, size, props], i) => (
        <Comp key={`${theme}-${i}`} size={size} className={`d d${i + 1}`} {...props} />
      ))}
    </div>
  )
}