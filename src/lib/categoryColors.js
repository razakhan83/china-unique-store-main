// ── Category Color Palettes ───────────────────────────────────────────────────
// 8 distinct pastel backgrounds. Each category section on the home page and
// product detail pages gets a different colour so users can instantly tell
// sections apart on both mobile and desktop.
//
// The `bg` property is a Tailwind class used when the class is statically
// resolvable. The `style` property is an inline-CSS fallback for dynamically
// generated category names that Tailwind JIT can't pre-scan.
// ─────────────────────────────────────────────────────────────────────────────

const PALETTES = [
  // 0 – Fresh Mint
  {
    bg: 'bg-[#edf7f2]',
    style: { backgroundColor: '#edf7f2' },
    text: 'text-emerald-800',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    border: 'border-emerald-200',
    accent: '#015347',
    hex: '#edf7f2',
  },
  // 1 – Soft Sage
  {
    bg: 'bg-[#f0f6f3]',
    style: { backgroundColor: '#f0f6f3' },
    text: 'text-emerald-900',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    border: 'border-emerald-200/70',
    accent: '#059669',
    hex: '#f0f6f3',
  },
  // 2 – Frosted Mint
  {
    bg: 'bg-[#e8f5ee]',
    style: { backgroundColor: '#e8f5ee' },
    text: 'text-emerald-900',
    badge: 'bg-emerald-100/60 text-emerald-800 border-emerald-200',
    border: 'border-emerald-200',
    accent: '#10b981',
    hex: '#e8f5ee',
  },
  // 3 – Cool Gray-Mint Neutral
  {
    bg: 'bg-[#f2f6f4]',
    style: { backgroundColor: '#f2f6f4' },
    text: 'text-slate-800',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    border: 'border-slate-200',
    accent: '#475569',
    hex: '#f2f6f4',
  },
  // 4 – Subtle Pale Emerald
  {
    bg: 'bg-[#edf5f1]',
    style: { backgroundColor: '#edf5f1' },
    text: 'text-emerald-800',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    border: 'border-emerald-200',
    accent: '#047857',
    hex: '#edf5f1',
  },
  // 5 – Clean Off-White Neutral
  {
    bg: 'bg-[#f6f8f7]',
    style: { backgroundColor: '#f6f8f7' },
    text: 'text-zinc-800',
    badge: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    border: 'border-zinc-200',
    accent: '#52525b',
    hex: '#f6f8f7',
  },
  // 6 – Light Eucalyptus
  {
    bg: 'bg-[#eaf4ef]',
    style: { backgroundColor: '#eaf4ef' },
    text: 'text-emerald-900',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    border: 'border-emerald-200/80',
    accent: '#0f766e',
    hex: '#eaf4ef',
  },
  // 7 – Slate Neutral
  {
    bg: 'bg-[#f1f4f3]',
    style: { backgroundColor: '#f1f4f3' },
    text: 'text-slate-700',
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
    border: 'border-slate-200',
    accent: '#64748b',
    hex: '#f1f4f3',
  },
];

// Named overrides — these guarantee a consistent colour for well-known categories
const CATEGORY_COLOR_MAP = {
  'kitchen accessories': PALETTES[0],
  'kitchen':             PALETTES[0],
  'kitchenware':         PALETTES[0],
  'home decor':          PALETTES[1],
  'home & living':       PALETTES[1],
  'health & beauty':     PALETTES[2],
  'beauty':              PALETTES[6],
  'personal care':       PALETTES[2],
  'fashion':             PALETTES[3],
  'clothing':            PALETTES[3],
  'apparel':             PALETTES[3],
  'stationery':          PALETTES[4],
  'office':              PALETTES[4],
  'toys & games':        PALETTES[4],
  'kids':                PALETTES[4],
  'electronics':         PALETTES[5],
  'gadgets':             PALETTES[5],
  'tech':                PALETTES[5],
  'sports & fitness':    PALETTES[7],
  'sports':              PALETTES[7],
  'pet supplies':        PALETTES[0],
  'automotive':          PALETTES[7],
  'tools':               PALETTES[7],
  'gifts':               PALETTES[6],
  'accessories':         PALETTES[3],
  'storage':             PALETTES[5],
  'lighting':            PALETTES[4],
  'baby':                PALETTES[2],
};

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Returns a colour palette for a given category name.
 *  Falls back to a hash-based palette for unknown categories
 *  so every category still gets a distinct, consistent colour. */
export function getCategoryColor(categoryName) {
  if (!categoryName) return PALETTES[0];

  const key = categoryName.toLowerCase().trim();
  if (CATEGORY_COLOR_MAP[key]) return CATEGORY_COLOR_MAP[key];

  return PALETTES[hashString(key) % PALETTES.length];
}

/** Returns a colour palette by array position (0, 1, 2 …).
 *  Use this when you want guaranteed alternating colors regardless of
 *  category name — e.g. home page sections where the Nth section
 *  should always get the Nth palette color. */
export function getCategoryColorByIndex(index) {
  return PALETTES[Math.abs(index) % PALETTES.length];
}

export function getAllCategoryColors() {
  return { ...CATEGORY_COLOR_MAP };
}
