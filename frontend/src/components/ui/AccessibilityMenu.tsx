import { useState, useEffect } from 'react';
import './AccessibilityMenu.css';

interface A11yPrefs {
  fontSize: 'normal' | 'large' | 'xlarge';
  highContrast: boolean;
  darkMode: boolean;
  largeCursor: boolean;
  reduceMotion: boolean;
  wideSpacing: boolean;
  soundEnabled: boolean;
}

const defaultPrefs: A11yPrefs = {
  fontSize: 'normal',
  highContrast: false,
  darkMode: false,
  largeCursor: false,
  reduceMotion: false,
  wideSpacing: false,
  soundEnabled: true,
};

function loadPrefs(): A11yPrefs {
  try {
    const stored = localStorage.getItem('a11y-prefs');
    return stored ? { ...defaultPrefs, ...JSON.parse(stored) } : defaultPrefs;
  } catch {
    return defaultPrefs;
  }
}

function applyPrefs(prefs: A11yPrefs) {
  const root = document.documentElement;

  root.classList.toggle('font-large', prefs.fontSize === 'large');
  root.classList.toggle('font-xlarge', prefs.fontSize === 'xlarge');
  root.classList.toggle('high-contrast', prefs.highContrast);
  root.classList.toggle('dark-mode', prefs.darkMode);
  root.classList.toggle('light-mode', !prefs.darkMode);
  root.classList.toggle('large-cursor', prefs.largeCursor);
  root.classList.toggle('reduce-motion', prefs.reduceMotion);
  root.classList.toggle('wide-spacing', prefs.wideSpacing);
}

export default function AccessibilityMenu() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<A11yPrefs>(loadPrefs);

  useEffect(() => {
    applyPrefs(prefs);
    localStorage.setItem('a11y-prefs', JSON.stringify(prefs));
  }, [prefs]);

  const update = (patch: Partial<A11yPrefs>) => {
    setPrefs(prev => ({ ...prev, ...patch }));
  };

  const handleReset = () => {
    setPrefs(defaultPrefs);
  };

  return (
    <div className="a11y-menu">
      <button
        className="a11y-menu__trigger"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="Menú de accesibilidad"
        aria-haspopup="dialog"
        type="button"
        id="accessibility-menu-trigger"
      >
        <span aria-hidden="true">♿</span>
      </button>

      {open && (
        <div
          className="a11y-menu__panel animate-slide-up"
          role="dialog"
          aria-label="Opciones de accesibilidad"
          aria-modal="true"
        >
          <div className="a11y-menu__header">
            <h3 className="a11y-menu__title">Accesibilidad</h3>
            <button
              type="button"
              className="a11y-menu__close"
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú de accesibilidad"
            >
              ✕
            </button>
          </div>

          {/* Font Size */}
          <div className="a11y-menu__group">
            <span className="a11y-menu__group-label" id="a11y-font-label">🔤 Tamaño de fuente</span>
            <div className="a11y-menu__radio-group" role="radiogroup" aria-labelledby="a11y-font-label">
              {(['normal', 'large', 'xlarge'] as const).map(size => (
                <label key={size} className="a11y-menu__radio-label">
                  <input
                    type="radio"
                    name="a11y-font"
                    checked={prefs.fontSize === size}
                    onChange={() => update({ fontSize: size })}
                  />
                  {size === 'normal' ? 'Normal' : size === 'large' ? 'Grande' : 'Extra grande'}
                </label>
              ))}
            </div>
          </div>

          {/* Toggles */}
          {[
            { key: 'highContrast' as const, icon: '🎨', label: 'Alto contraste' },
            { key: 'darkMode' as const, icon: '🌗', label: 'Modo oscuro' },
            { key: 'largeCursor' as const, icon: '🖱️', label: 'Cursor grande' },
            { key: 'reduceMotion' as const, icon: '⏸️', label: 'Reducir animaciones' },
            { key: 'wideSpacing' as const, icon: '📖', label: 'Espaciado ampliado' },
            { key: 'soundEnabled' as const, icon: '🔊', label: 'Sonido de confirmación' },
          ].map(({ key, icon, label }) => (
            <label key={key} className="a11y-menu__toggle">
              <span>{icon} {label}</span>
              <input
                type="checkbox"
                checked={prefs[key]}
                onChange={e => update({ [key]: e.target.checked })}
              />
            </label>
          ))}

          <button
            className="btn btn-ghost btn-sm a11y-menu__reset"
            onClick={handleReset}
            type="button"
          >
            Restablecer todo
          </button>
        </div>
      )}
    </div>
  );
}
