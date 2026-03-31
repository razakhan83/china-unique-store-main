const SEMANTIC_PALETTES = [
  {
    bg: 'bg-primary/10',
    text: 'text-primary',
    badge: 'bg-primary/10 text-primary border-primary/20',
    border: 'border-primary/20',
    accent: 'var(--color-primary)',
    hex: 'var(--color-primary)',
  },
  {
    bg: 'bg-accent/15',
    text: 'text-accent-foreground',
    badge: 'bg-accent/15 text-accent-foreground border-accent/25',
    border: 'border-accent/25',
    accent: 'var(--color-accent)',
    hex: 'var(--color-accent)',
  },
  {
    bg: 'bg-success/10',
    text: 'text-success',
    badge: 'bg-success/10 text-success border-success/20',
    border: 'border-success/20',
    accent: 'var(--color-success)',
    hex: 'var(--color-success)',
  },
  {
    bg: 'bg-secondary',
    text: 'text-secondary-foreground',
    badge: 'bg-secondary text-secondary-foreground border-border',
    border: 'border-border',
    accent: 'var(--color-secondary)',
    hex: 'var(--color-secondary)',
  },
  {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    badge: 'bg-muted text-muted-foreground border-border',
    border: 'border-border',
    accent: 'var(--color-muted)',
    hex: 'var(--color-muted)',
  },
];

const CATEGORY_COLOR_MAP = {
  'kitchen accessories': SEMANTIC_PALETTES[0],
  'home decor': SEMANTIC_PALETTES[1],
  'health & beauty': SEMANTIC_PALETTES[2],
  stationery: SEMANTIC_PALETTES[3],
  'toys & games': SEMANTIC_PALETTES[4],
  electronics: SEMANTIC_PALETTES[0],
  fashion: SEMANTIC_PALETTES[1],
  'sports & fitness': SEMANTIC_PALETTES[2],
  'pet supplies': SEMANTIC_PALETTES[3],
  automotive: SEMANTIC_PALETTES[4],
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

export function getCategoryColor(categoryName) {
  if (!categoryName) return SEMANTIC_PALETTES[0];

  const key = categoryName.toLowerCase().trim();
  if (CATEGORY_COLOR_MAP[key]) return CATEGORY_COLOR_MAP[key];

  return SEMANTIC_PALETTES[hashString(key) % SEMANTIC_PALETTES.length];
}

export function getAllCategoryColors() {
  return { ...CATEGORY_COLOR_MAP };
}
