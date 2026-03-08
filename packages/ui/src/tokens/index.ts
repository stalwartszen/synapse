/**
 * Synapse Design Tokens
 * Single source of truth for all visual design decisions.
 */

// ─── Colors ──────────────────────────────────────────────────────────────────

export const colors = {
  // Background layers
  bg: {
    primary: '#0f1117',
    secondary: '#161b27',
    tertiary: '#1e2535',
    elevated: '#252d3d',
    overlay: 'rgba(15, 17, 23, 0.85)',
  },

  // Node type colors
  node: {
    concept: '#3b82f6',   // blue
    resource: '#22c55e',  // green
    question: '#eab308',  // yellow
    insight: '#a855f7',   // purple
    custom: '#f97316',    // orange
    selected: '#38bdf8',  // sky
  },

  // Edge colors
  edge: {
    default: '#334155',
    hover: '#475569',
    selected: '#38bdf8',
    'relates-to': '#64748b',
    'depends-on': '#f97316',
    causes: '#ef4444',
    contradicts: '#ec4899',
    supports: '#22c55e',
    custom: '#a855f7',
  },

  // Brand
  brand: {
    primary: '#6366f1',   // indigo
    primaryHover: '#818cf8',
    primaryActive: '#4f46e5',
    accent: '#38bdf8',    // sky
  },

  // Text
  text: {
    primary: '#f1f5f9',
    secondary: '#94a3b8',
    tertiary: '#64748b',
    disabled: '#334155',
    inverse: '#0f1117',
    link: '#60a5fa',
  },

  // Borders
  border: {
    subtle: '#1e2535',
    default: '#2d3748',
    strong: '#4a5568',
    focus: '#6366f1',
  },

  // Status
  status: {
    success: '#22c55e',
    successBg: 'rgba(34, 197, 94, 0.1)',
    warning: '#eab308',
    warningBg: 'rgba(234, 179, 8, 0.1)',
    error: '#ef4444',
    errorBg: 'rgba(239, 68, 68, 0.1)',
    info: '#3b82f6',
    infoBg: 'rgba(59, 130, 246, 0.1)',
  },

  // Collaboration cursors
  collaborators: [
    '#f97316', // orange
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#10b981', // emerald
    '#e11d48', // rose
  ],
} as const;

// ─── Spacing ─────────────────────────────────────────────────────────────────

export const spacing = {
  0: '0px',
  0.5: '2px',
  1: '4px',
  1.5: '6px',
  2: '8px',
  2.5: '10px',
  3: '12px',
  3.5: '14px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px',
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
  24: '96px',
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────

export const typography = {
  fontFamily: {
    sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
  },
  fontSize: {
    xs: '11px',
    sm: '13px',
    base: '14px',
    md: '15px',
    lg: '16px',
    xl: '18px',
    '2xl': '20px',
    '3xl': '24px',
    '4xl': '30px',
    '5xl': '36px',
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
  },
  letterSpacing: {
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// ─── Shadows ──────────────────────────────────────────────────────────────────

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
  md: '0 4px 6px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.5), 0 4px 6px rgba(0, 0, 0, 0.4)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.6), 0 8px 10px rgba(0, 0, 0, 0.4)',
  glow: {
    blue: '0 0 20px rgba(59, 130, 246, 0.4)',
    purple: '0 0 20px rgba(168, 85, 247, 0.4)',
    green: '0 0 20px rgba(34, 197, 94, 0.4)',
    brand: '0 0 20px rgba(99, 102, 241, 0.4)',
  },
  node: '0 2px 8px rgba(0, 0, 0, 0.5)',
  panel: '0 8px 32px rgba(0, 0, 0, 0.6)',
} as const;

// ─── Border radius ────────────────────────────────────────────────────────────

export const radii = {
  none: '0px',
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  '2xl': '16px',
  '3xl': '24px',
  full: '9999px',
} as const;

// ─── Transitions ──────────────────────────────────────────────────────────────

export const transitions = {
  fast: '100ms ease',
  normal: '150ms ease',
  slow: '250ms ease',
  spring: '300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

// ─── Z-index ──────────────────────────────────────────────────────────────────

export const zIndex = {
  base: 0,
  raised: 10,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  toast: 500,
  tooltip: 600,
} as const;

// ─── Breakpoints ──────────────────────────────────────────────────────────────

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ─── CSS variables map ────────────────────────────────────────────────────────

export const cssVariables = {
  '--color-bg-primary': colors.bg.primary,
  '--color-bg-secondary': colors.bg.secondary,
  '--color-bg-tertiary': colors.bg.tertiary,
  '--color-bg-elevated': colors.bg.elevated,
  '--color-text-primary': colors.text.primary,
  '--color-text-secondary': colors.text.secondary,
  '--color-text-tertiary': colors.text.tertiary,
  '--color-border-default': colors.border.default,
  '--color-brand-primary': colors.brand.primary,
  '--color-brand-accent': colors.brand.accent,
  '--color-node-concept': colors.node.concept,
  '--color-node-resource': colors.node.resource,
  '--color-node-question': colors.node.question,
  '--color-node-insight': colors.node.insight,
  '--color-node-custom': colors.node.custom,
  '--color-status-success': colors.status.success,
  '--color-status-error': colors.status.error,
  '--color-status-warning': colors.status.warning,
  '--shadow-panel': shadows.panel,
  '--radius-md': radii.md,
  '--radius-lg': radii.lg,
  '--transition-normal': transitions.normal,
} as const;
