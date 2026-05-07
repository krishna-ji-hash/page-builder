'use client';

import { useBuilderTheme } from '@/context/BuilderThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useBuilderTheme();

  return (
    <button type="button" className="bld-topbar__theme-btn" onClick={toggleTheme} aria-label="Toggle color theme">
      {theme === 'dark' ? 'Light UI' : 'Dark UI'}
    </button>
  );
}
