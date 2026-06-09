/**
 * One-click style_json patches for common UI patterns (desktop layer).
 * Inspector applies via mergeStyleForDevice on active breakpoint.
 */

export const BUTTON_STYLE_PRESETS = {
  primary: {
    colors: { textColor: '#ffffff', backgroundColor: '#4f46e5' },
    background: { backgroundColor: '#4f46e5' },
    border: { radius: '10px', width: '0px', style: 'solid', color: 'transparent' },
    typography: { fontWeight: '600' },
    spacing: { padding: '12px 22px' },
    effects: { boxShadow: '0 8px 20px rgba(79, 70, 229, 0.35)' },
  },
  outline: {
    colors: { textColor: '#4f46e5', backgroundColor: 'transparent' },
    background: { backgroundColor: 'transparent' },
    border: { radius: '10px', width: '2px', style: 'solid', color: '#4f46e5' },
    typography: { fontWeight: '600' },
    spacing: { padding: '10px 20px' },
    effects: { boxShadow: 'none' },
  },
  ghost: {
    colors: { textColor: '#334155', backgroundColor: 'transparent' },
    background: { backgroundColor: 'transparent' },
    border: { radius: '8px', width: '0px', style: 'solid', color: 'transparent' },
    spacing: { padding: '10px 16px' },
    effects: { boxShadow: 'none' },
  },
  gradient: {
    colors: { textColor: '#ffffff', backgroundColor: 'transparent' },
    background: {
      backgroundColor: 'transparent',
      backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
    },
    border: { radius: '12px', width: '0px', style: 'solid', color: 'transparent' },
    typography: { fontWeight: '600' },
    spacing: { padding: '12px 24px' },
    effects: { boxShadow: '0 10px 28px rgba(99, 102, 241, 0.35)' },
  },
  glass: {
    colors: { textColor: '#0f172a', backgroundColor: 'rgba(255,255,255,0.55)' },
    background: { backgroundColor: 'rgba(255,255,255,0.55)' },
    border: { radius: '14px', width: '1px', style: 'solid', color: 'rgba(255,255,255,0.65)' },
    effects: { boxShadow: '0 8px 32px rgba(15, 23, 42, 0.12)', backdropFilter: 'blur(12px)' },
    spacing: { padding: '12px 20px' },
    typography: { fontWeight: '600' },
  },
  secondary: {
    colors: { textColor: '#ffffff', backgroundColor: '#64748b' },
    background: { backgroundColor: '#64748b' },
    border: { radius: '10px', width: '0px', style: 'solid', color: 'transparent' },
    typography: { fontWeight: '600' },
    spacing: { padding: '12px 22px' },
    effects: { boxShadow: '0 6px 16px rgba(100, 116, 139, 0.35)' },
  },
  success: {
    colors: { textColor: '#ffffff', backgroundColor: '#16a34a' },
    background: { backgroundColor: '#16a34a' },
    border: { radius: '10px', width: '0px', style: 'solid', color: 'transparent' },
    typography: { fontWeight: '600' },
    spacing: { padding: '12px 22px' },
    effects: { boxShadow: '0 8px 20px rgba(22, 163, 74, 0.35)' },
  },
  danger: {
    colors: { textColor: '#ffffff', backgroundColor: '#dc2626' },
    background: { backgroundColor: '#dc2626' },
    border: { radius: '10px', width: '0px', style: 'solid', color: 'transparent' },
    typography: { fontWeight: '600' },
    spacing: { padding: '12px 22px' },
    effects: { boxShadow: '0 8px 20px rgba(220, 38, 38, 0.35)' },
  },
  warning: {
    colors: { textColor: '#0f172a', backgroundColor: '#f59e0b' },
    background: { backgroundColor: '#f59e0b' },
    border: { radius: '10px', width: '0px', style: 'solid', color: 'transparent' },
    typography: { fontWeight: '600' },
    spacing: { padding: '12px 22px' },
    effects: { boxShadow: '0 8px 20px rgba(245, 158, 11, 0.35)' },
  },
  link: {
    colors: { textColor: '#4f46e5', backgroundColor: 'transparent' },
    background: { backgroundColor: 'transparent' },
    border: { radius: '0px', width: '0px', style: 'solid', color: 'transparent' },
    typography: { fontWeight: '600', textDecoration: 'underline' },
    spacing: { padding: '4px 8px' },
    effects: { boxShadow: 'none' },
  },
  pill: {
    colors: { textColor: '#ffffff', backgroundColor: '#4f46e5' },
    background: { backgroundColor: '#4f46e5' },
    border: { radius: '999px', width: '0px', style: 'solid', color: 'transparent' },
    typography: { fontWeight: '600' },
    spacing: { padding: '12px 28px' },
    effects: { boxShadow: '0 8px 20px rgba(79, 70, 229, 0.35)' },
  },
  soft: {
    colors: { textColor: '#4338ca', backgroundColor: 'rgba(99, 102, 241, 0.12)' },
    background: { backgroundColor: 'rgba(99, 102, 241, 0.12)' },
    border: { radius: '10px', width: '0px', style: 'solid', color: 'transparent' },
    typography: { fontWeight: '600' },
    spacing: { padding: '12px 22px' },
    effects: { boxShadow: 'none' },
  },
  dark: {
    colors: { textColor: '#f8fafc', backgroundColor: '#0f172a' },
    background: { backgroundColor: '#0f172a' },
    border: { radius: '10px', width: '0px', style: 'solid', color: 'transparent' },
    typography: { fontWeight: '600' },
    spacing: { padding: '12px 22px' },
    effects: { boxShadow: '0 8px 24px rgba(15, 23, 42, 0.4)' },
  },
  neon: {
    colors: { textColor: '#ffffff', backgroundColor: 'transparent' },
    background: {
      backgroundColor: 'transparent',
      backgroundImage: 'linear-gradient(135deg, #22d3ee 0%, #6366f1 50%, #a855f7 100%)',
    },
    border: { radius: '12px', width: '0px', style: 'solid', color: 'transparent' },
    typography: { fontWeight: '700' },
    spacing: { padding: '12px 24px' },
    effects: { boxShadow: '0 0 24px rgba(99, 102, 241, 0.55)' },
  },
};

export const CARD_STYLE_PRESETS = {
  flat: {
    background: { backgroundColor: '#ffffff' },
    border: { radius: '12px', width: '1px', style: 'solid', color: '#e2e8f0' },
    effects: { boxShadow: 'none' },
    spacing: { padding: '24px' },
  },
  softShadow: {
    background: { backgroundColor: '#ffffff' },
    border: { radius: '16px', width: '0px', style: 'solid', color: 'transparent' },
    effects: { boxShadow: '0 12px 32px rgba(15, 23, 42, 0.1)' },
    spacing: { padding: '28px' },
  },
  glass: {
    background: { backgroundColor: 'rgba(255,255,255,0.6)' },
    border: { radius: '18px', width: '1px', style: 'solid', color: 'rgba(255,255,255,0.7)' },
    effects: { boxShadow: '0 8px 32px rgba(15, 23, 42, 0.08)', backdropFilter: 'blur(14px)' },
    spacing: { padding: '24px' },
  },
  premiumGradient: {
    background: {
      backgroundColor: '#1e1b4b',
      backgroundImage: 'linear-gradient(145deg, #312e81 0%, #4c1d95 45%, #831843 100%)',
    },
    colors: { textColor: '#f8fafc', backgroundColor: '#1e1b4b' },
    border: { radius: '20px', width: '0px', style: 'solid', color: 'transparent' },
    effects: { boxShadow: '0 20px 48px rgba(49, 46, 129, 0.45)' },
    spacing: { padding: '32px' },
  },
};

export const SECTION_STYLE_PRESETS = {
  light: {
    background: { backgroundColor: '#ffffff' },
    colors: { backgroundColor: '#ffffff' },
    spacing: { padding: '64px 24px' },
  },
  dark: {
    background: { backgroundColor: '#0f172a' },
    colors: { backgroundColor: '#0f172a', textColor: '#f8fafc' },
    typography: { color: '#f8fafc' },
    spacing: { padding: '72px 24px' },
  },
  gradient: {
    background: {
      backgroundColor: '#4f46e5',
      backgroundImage: 'linear-gradient(120deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)',
    },
    colors: { backgroundColor: '#4f46e5', textColor: '#ffffff' },
    typography: { color: '#ffffff' },
    spacing: { padding: '80px 24px' },
  },
  glassHero: {
    background: { backgroundColor: 'rgba(15, 23, 42, 0.45)' },
    effects: { backdropFilter: 'blur(8px)' },
    spacing: { padding: '96px 24px' },
  },
  boxedContainer: {
    layout: { maxWidth: '1200px' },
    spacing: { padding: '48px 32px', margin: '0 auto' },
    background: { backgroundColor: '#f8fafc' },
    border: { radius: '16px', width: '1px', style: 'solid', color: '#e2e8f0' },
  },
};

export const TEXT_STYLE_PRESETS = {
  heroHeading: {
    typography: {
      fontSize: '56px',
      fontWeight: '700',
      lineHeight: '1.1',
      letterSpacing: '-1px',
      textAlign: 'center',
    },
  },
  sectionTitle: {
    typography: {
      fontSize: '36px',
      fontWeight: '700',
      lineHeight: '1.2',
      letterSpacing: '-0.5px',
    },
  },
  body: {
    typography: {
      fontSize: '16px',
      fontWeight: '400',
      lineHeight: '1.6',
      letterSpacing: '0px',
    },
  },
  caption: {
    typography: {
      fontSize: '13px',
      fontWeight: '500',
      lineHeight: '1.4',
      letterSpacing: '0.02em',
      textTransform: 'uppercase',
    },
    colors: { textColor: '#64748b' },
  },
};

export function presetPatchForNodeType(nodeType, category, presetId) {
  if (category === 'button' && nodeType === 'button') return BUTTON_STYLE_PRESETS[presetId] || null;
  if (category === 'card' && (nodeType === 'content_card' || nodeType === 'stack')) return CARD_STYLE_PRESETS[presetId] || null;
  if (category === 'section' && nodeType === 'row') return SECTION_STYLE_PRESETS[presetId] || null;
  if (category === 'text' && (nodeType === 'heading' || nodeType === 'text' || nodeType === 'rich_text')) {
    return TEXT_STYLE_PRESETS[presetId] || null;
  }
  return null;
}
