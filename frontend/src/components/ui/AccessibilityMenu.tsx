import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import AccessibleTooltip from './AccessibleTooltip';
import './AccessibilityMenu.css';

interface A11yPrefs {
  fontSize: 'normal' | 'large' | 'xlarge';
  highContrast: boolean;
  darkMode: boolean;
  largeCursor: boolean;
  reduceMotion: boolean;
  wideSpacing: boolean;
  soundEnabled: boolean;
  noSessionTimeout: boolean;
}

type BooleanPrefKey = {
  [K in keyof A11yPrefs]: A11yPrefs[K] extends boolean ? K : never;
}[keyof A11yPrefs];

const defaultPrefs: A11yPrefs = {
  fontSize: 'normal',
  highContrast: false,
  darkMode: false,
  largeCursor: false,
  reduceMotion: false,
  wideSpacing: false,
  soundEnabled: true,
  noSessionTimeout: false,
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

const BOOL_TOGGLES: { key: BooleanPrefKey; icon: string; label: string }[] = [
  { key: 'highContrast',    icon: '🎨', label: 'Alto contraste' },
  { key: 'darkMode',        icon: '🌗', label: 'Modo oscuro' },
  { key: 'largeCursor',     icon: '🖱️', label: 'Cursor grande' },
  { key: 'reduceMotion',    icon: '⏸️', label: 'Reducir animaciones' },
  { key: 'wideSpacing',     icon: '📖', label: 'Espaciado ampliado' },
  { key: 'soundEnabled',    icon: '🔊', label: 'Sonido de confirmación' },
  { key: 'noSessionTimeout',icon: '⏱️', label: 'Tiempo de sesión ilimitado' },
];

export default function AccessibilityMenu() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<A11yPrefs>(loadPrefs);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    applyPrefs(prefs);
    localStorage.setItem('a11y-prefs', JSON.stringify(prefs));
    window.dispatchEvent(new CustomEvent('a11y-prefs-changed'));
  }, [prefs]);

  const update = (patch: Partial<A11yPrefs>) => {
    setPrefs(prev => ({ ...prev, ...patch }));
  };

  const handleReset = () => {
    setPrefs(defaultPrefs);
  };

  return (
    <div className="a11y-menu">
      <AccessibleTooltip content="Menú de accesibilidad">
        <button
          ref={triggerRef}
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
      </AccessibleTooltip>

      {open && createPortal(
        <div
          className="a11y-menu__panel animate-slide-up"
          role="dialog"
          aria-label="Opciones de accesibilidad"
          aria-modal="true"
        >
          <div className="a11y-menu__header">
            <h3 className="a11y-menu__title">Accesibilidad</h3>
            <AccessibleTooltip content="Cerrar menú de accesibilidad">
              <button
                type="button"
                className="a11y-menu__close"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú de accesibilidad"
              >
                ✕
              </button>
            </AccessibleTooltip>
          </div>

          {/* Font Size */}
          <div className="a11y-menu__group">
            <span className="a11y-menu__group-label" id="a11y-font-label">🔤 Tamaño de fuente</span>
            <div className="a11y-font-chips" role="radiogroup" aria-labelledby="a11y-font-label">
              {([
                { value: 'normal' as const, label: 'Normal' },
                { value: 'large'  as const, label: 'Grande' },
                { value: 'xlarge' as const, label: 'Extra'  },
              ]).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={prefs.fontSize === opt.value}
                  className={`a11y-font-chip${prefs.fontSize === opt.value ? ' a11y-font-chip--active' : ''}`}
                  onClick={() => update({ fontSize: opt.value })}
                  aria-label={`Tamaño de fuente: ${opt.label}`}
                >
                  <span
                    className="a11y-font-chip__letter"
                    style={{ fontSize: opt.value === 'normal' ? '1rem' : opt.value === 'large' ? '1.2rem' : '1.45rem' }}
                  >
                    A
                  </span>
                  <span className="a11y-font-chip__desc">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Boolean Toggles */}
          {BOOL_TOGGLES.map(({ key, icon, label }) => (
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
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setOpen(false);
              setTimeout(() => window.dispatchEvent(new CustomEvent('open-keyboard-shortcuts')), 150);
            }}
          >
            ⌨️ Atajos de teclado
          </button>

          <button
            className="btn btn-ghost btn-sm a11y-menu__reset"
            onClick={handleReset}
            type="button"
          >
            Restablecer todo
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
