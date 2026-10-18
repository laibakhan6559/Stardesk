// Stardesk themes. The colours themselves live in styles.css (:root[data-theme='...']).
// This file is the single list used by the top-bar picker, Settings and the store.

export const THEMES = [
  { id: 'pink', name: 'Pink Pixel', emoji: '🌸', dark: false, meta: '#ff9bc8', swatch: ['#f8b9d8', '#ff6fb0', '#7f9bf0'] },
  { id: 'ocean', name: 'Ocean Blue', emoji: '🌊', dark: false, meta: '#8fc4f2', swatch: ['#bde4fb', '#4db3ff', '#2f7fd6'] },
  { id: 'forest', name: 'Fresh Green', emoji: '🌿', dark: false, meta: '#96cfa4', swatch: ['#cdeccf', '#3ecf7b', '#2e9e5b'] },
  { id: 'sunset', name: 'Sunset Orange', emoji: '🌅', dark: false, meta: '#ffb08c', swatch: ['#ffd9b3', '#ff8a3d', '#e8742a'] },
  { id: 'sand', name: 'Warm Sand', emoji: '🏜️', dark: false, meta: '#d6c096', swatch: ['#efe3cc', '#d4a24c', '#8a6a3b'] },
  { id: 'silver', name: 'Silver Gray', emoji: '🩶', dark: false, meta: '#cbd0d9', swatch: ['#dcdfe5', '#8d97a8', '#4b5563'] },
  { id: 'galaxy', name: 'Galaxy Night', emoji: '🌌', dark: true, meta: '#1b0c3f', swatch: ['#1b0c3f', '#ff5fb2', '#6a3fe0'] },
  { id: 'midnight', name: 'Midnight Blue', emoji: '🌙', dark: true, meta: '#0a1736', swatch: ['#0a1736', '#4db3ff', '#1f5fd6'] },
  { id: 'emerald', name: 'Emerald Night', emoji: '🌲', dark: true, meta: '#08231a', swatch: ['#08231a', '#3eeaa0', '#1a8a55'] },
  { id: 'ember', name: 'Ember Dark', emoji: '🔥', dark: true, meta: '#1a110c', swatch: ['#1a110c', '#ff8a3d', '#c2410c'] },
  { id: 'graphite', name: 'Graphite Black', emoji: '🖤', dark: true, meta: '#151517', swatch: ['#0a0a0b', '#d2d6df', '#5a5a64'] },
]

export const THEME_IDS = THEMES.map((t) => t.id)

export const getTheme = (id) => THEMES.find((t) => t.id === id) || THEMES[0]

export const normalizeTheme = (id) => (THEME_IDS.includes(id) ? id : 'pink')

export const defaultTheme = (prefersDark) => (prefersDark ? 'galaxy' : 'pink')