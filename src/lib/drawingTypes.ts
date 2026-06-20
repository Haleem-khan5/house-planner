export const DRAWING_TYPE_META = {
  architectural: {
    label: 'Architectural Plan',
    icon: '🏠',
    color: '#3b82f6',
    bg: '#eff6ff',
    desc: 'Room layout, doors, windows, stairs, parking',
  },
  structural: {
    label: 'Structural Drawing',
    icon: '⚙️',
    color: '#92400e',
    bg: '#fef3c7',
    desc: 'Foundation, columns, beams, load-bearing walls',
  },
  electrical: {
    label: 'Electrical Drawing',
    icon: '⚡',
    color: '#d97706',
    bg: '#fffbeb',
    desc: 'Wiring, lights, fans, switches, AC points, sockets',
  },
  plumbing: {
    label: 'Plumbing Drawing',
    icon: '🔧',
    color: '#0891b2',
    bg: '#ecfeff',
    desc: 'Water supply, drainage pipes, fixtures, tanks',
  },
  foundation: {
    label: 'Foundation Plan',
    icon: '🏗️',
    color: '#6b7280',
    bg: '#f3f4f6',
    desc: 'Footings, column layout, plinth beams, DPC',
  },
  'site-plan': {
    label: 'Site Plan',
    icon: '📐',
    color: '#16a34a',
    bg: '#f0fdf4',
    desc: 'Plot boundary, road, setbacks, landscaping, parking',
  },
  elevation: {
    label: 'Elevation Drawing',
    icon: '🏢',
    color: '#7c3aed',
    bg: '#faf5ff',
    desc: 'Front, back, and side exterior views of the house',
  },
} as const;

export type DrawingType = keyof typeof DRAWING_TYPE_META;
