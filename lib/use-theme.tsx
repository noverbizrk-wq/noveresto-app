'use client';

import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'nr_theme';

type Theme = 'dark' | 'light';

function applyTheme(theme: Theme) {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

/**
 * Thème clair/sombre pour le module "Gestion du restaurant".
 * Persisté en localStorage (préférence purement visuelle, pas besoin de
 * synchronisation serveur). Défaut : sombre, pour ne rien changer au
 * comportement existant tant que l'utilisateur n'a pas fait de choix.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial = stored === 'light' ? 'light' : 'dark';
    setTheme(initial);
    applyTheme(initial);
    setMounted(true);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, next);
      applyTheme(next);
      return next;
    });
  }, []);

  return { theme, toggleTheme, mounted };
}

export function ThemeToggleButton() {
  const { theme, toggleTheme, mounted } = useTheme();

  if (!mounted) return null; // évite un flash de contenu incohérent (hydratation)

  return (
    <button
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre'}
      style={{
        background: 'transparent', border: '1px solid #1A3A52', borderRadius: 8,
        width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', fontSize: 14
      }}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
