import { useEffect, useRef } from 'react';
import { useToast, type Toast } from '../../context/ToastContext';
import AccessibleTooltip from './AccessibleTooltip';
import './ToastContainer.css';

const ICONS: Record<Toast['type'], string> = {
  success: '✅',
  error:   '❌',
  warning: '⚠️',
  info:    'ℹ️',
};

/* WCAG 4.1.3:
   - success / info / warning  →  role="status"  aria-live="polite"
     (no interrumpe al lector, espera a que termine de hablar)
   - error                     →  role="alert"   aria-live="assertive"
     (interrumpe inmediatamente — el usuario DEBE enterarse del error)
*/
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const isError = toast.type === 'error';
  const timerRef = useRef<HTMLDivElement>(null);

  // Animar la barra de progreso si hay duración
  useEffect(() => {
    if (!timerRef.current || !toast.duration) return;
    const el = timerRef.current;
    el.style.animationDuration = `${toast.duration}ms`;
    el.classList.add('toast__timer--running');
  }, [toast.duration]);

  return (
    <div
      className={`toast toast--${toast.type}`}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <span className="toast__icon" aria-hidden="true">{ICONS[toast.type]}</span>

      <div className="toast__body">
        <p className="toast__title">{toast.title}</p>
        {toast.message && <p className="toast__message">{toast.message}</p>}
      </div>

      <AccessibleTooltip content={`Cerrar notificación: ${toast.title}`}>
        <button
          type="button"
          className="toast__close"
          onClick={onDismiss}
          aria-label={`Cerrar notificación: ${toast.title}`}
        >
          ✕
        </button>
      </AccessibleTooltip>

      {/* Barra de progreso visual (decorativa) */}
      {toast.duration && toast.duration > 0 && (
        <div className="toast__timer" ref={timerRef} aria-hidden="true" />
      )}
    </div>
  );
}

export default function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    /* aria-label describe la región para usuarios de lector de pantalla */
    <div
      className="toast-container"
      aria-label="Notificaciones del sistema"
    >
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => dismissToast(toast.id)}
        />
      ))}
    </div>
  );
}
