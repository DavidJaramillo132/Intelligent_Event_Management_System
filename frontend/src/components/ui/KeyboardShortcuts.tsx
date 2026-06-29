import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './KeyboardShortcuts.css';

interface Shortcut {
  keys: string[];        // teclas a mostrar en el badge
  description: string;
  category: string;
  action?: () => void;   // si no tiene action, es solo informativo
}

function KbdBadge({ keys }: { keys: string[] }) {
  return (
    <span className="ks-keys" aria-hidden="true">
      {keys.map((k, i) => (
        <span key={i}>
          <kbd className="ks-kbd">{k}</kbd>
          {i < keys.length - 1 && <span className="ks-plus">+</span>}
        </span>
      ))}
    </span>
  );
}

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // Atajos disponibles — dependen del rol
  const shortcuts: Shortcut[] = [
    // Navegación general
    { keys: ['Shift'], description: 'Mostrar / ocultar esta guía', category: 'General' },
    { keys: ['Alt', 'I'], description: 'Ir al inicio', category: 'Navegación',
      action: () => { navigate('/'); close(); } },
    { keys: ['Alt', 'E'], description: 'Explorar eventos', category: 'Navegación',
      action: () => { navigate('/eventos'); close(); } },
    { keys: ['Alt', 'P'], description: 'Mi perfil', category: 'Navegación',
      action: () => { if (isAuthenticated) { navigate('/perfil'); close(); } } },
    { keys: ['Esc'], description: 'Cerrar paneles / modales', category: 'General' },
    { keys: ['Tab'], description: 'Navegar entre elementos interactivos', category: 'General' },
    { keys: ['Enter', 'Espacio'], description: 'Activar botón / enlace enfocado', category: 'General' },
    // Solo para organizador/admin
    ...(isAuthenticated && (user?.rol === 'organizador' || user?.rol === 'admin') ? [
      { keys: ['Alt', 'O'], description: 'Panel organizador', category: 'Organizador',
        action: () => { navigate('/organizador'); close(); } },
      { keys: ['Alt', 'C'], description: 'Crear nuevo evento', category: 'Organizador',
        action: () => { navigate('/eventos/crear'); close(); } },
    ] : []),
    // Solo para admin
    ...(isAuthenticated && user?.rol === 'admin' ? [
      { keys: ['Alt', 'U'], description: 'Gestión de usuarios', category: 'Administrador',
        action: () => { navigate('/admin/usuarios'); close(); } },
      { keys: ['Alt', 'A'], description: 'Auditoría del sistema', category: 'Administrador',
        action: () => { navigate('/admin/auditoria'); close(); } },
    ] : []),
    // Accesibilidad
    { keys: ['Alt', 'X'], description: 'Abrir menú de accesibilidad', category: 'Accesibilidad',
      action: () => {
        close();
        setTimeout(() => {
          const btn = document.getElementById('accessibility-menu-trigger') as HTMLButtonElement | null;
          btn?.click();
          btn?.focus();
        }, 100);
      } },
    { keys: ['Alt', 'M'], description: 'Ir al contenido principal', category: 'Accesibilidad',
      action: () => {
        close();
        const main = document.getElementById('main-content');
        main?.focus();
        main?.scrollIntoView({ behavior: 'smooth' });
      } },
  ];

  // Agrupa por categoría
  const categories = [...new Set(shortcuts.map(s => s.category))];

  // Listener global de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el foco está en un input/textarea/select
      const tag = (e.target as HTMLElement).tagName;
      const isEditable = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
        || (e.target as HTMLElement).isContentEditable;

      // Shift solo (sin otras teclas) — abre/cierra la guía
      if (e.key === 'Shift' && !e.ctrlKey && !e.altKey && !e.metaKey && !isEditable) {
        // Esperamos el keyup para no confundir con Shift+Tab, etc.
        return;
      }

      // Escape — cierra
      if (e.key === 'Escape' && open) {
        e.preventDefault();
        close();
        return;
      }

      // Alt + tecla — ejecuta atajos de navegación
      if (e.altKey && !isEditable) {
        const key = e.key.toUpperCase();
        const match = shortcuts.find(
          s => s.keys.length === 2 &&
               s.keys[0] === 'Alt' &&
               s.keys[1] === key &&
               s.action
        );
        if (match?.action) {
          e.preventDefault();
          match.action();
        }
      }
    };

    // Shift keyup para abrir/cerrar (así no interfiere con Shift+Tab)
    const handleKeyUp = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const isEditable = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
        || (e.target as HTMLElement).isContentEditable;
      if (e.key === 'Shift' && !e.ctrlKey && !e.altKey && !e.metaKey && !isEditable) {
        setOpen(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [open, shortcuts, close]);

  // Trampa de foco cuando el panel está abierto
  useEffect(() => {
    if (open) {
      panelRef.current?.focus();
    }
  }, [open]);

  // Click fuera → cerrar
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, close]);

  if (!open) return null;

  return (
    <div
      className="ks-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Guía de atajos de teclado"
    >
      <div
        className="ks-panel animate-slide-up"
        ref={panelRef}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="ks-header">
          <div className="ks-header__left">
            <span className="ks-header__icon" aria-hidden="true">⌨️</span>
            <div>
              <h2 className="ks-title">Atajos de teclado</h2>
              <p className="ks-subtitle">Navega más rápido sin usar el ratón</p>
            </div>
          </div>
          <button
            type="button"
            className="ks-close"
            onClick={close}
            aria-label="Cerrar guía de atajos"
          >
            ✕
          </button>
        </div>

        {/* Tip */}
        <div className="ks-tip" role="note">
          <kbd className="ks-kbd">Shift</kbd>
          <span>para abrir o cerrar esta guía en cualquier momento</span>
        </div>

        {/* Atajos agrupados */}
        <div className="ks-body">
          {categories.map(cat => (
            <section key={cat} className="ks-group" aria-labelledby={`ks-cat-${cat}`}>
              <h3 id={`ks-cat-${cat}`} className="ks-group__title">{cat}</h3>
              <ul className="ks-list">
                {shortcuts
                  .filter(s => s.category === cat)
                  .map((s, i) => (
                    <li key={i} className="ks-item">
                      <span className="ks-item__desc">{s.description}</span>
                      <KbdBadge keys={s.keys} />
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>

        {/* Footer */}
        <div className="ks-footer">
          <button type="button" className="btn btn-primary btn-sm" onClick={close}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
