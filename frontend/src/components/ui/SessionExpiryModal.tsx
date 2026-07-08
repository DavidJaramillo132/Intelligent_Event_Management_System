import { useEffect, useRef } from 'react';
import './SessionExpiryModal.css';

interface Props {
  secondsRemaining: number;
  onExtend: () => void;
  onLogout: () => void;
}

export default function SessionExpiryModal({ secondsRemaining, onExtend, onLogout }: Props) {
  const extendRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    extendRef.current?.focus();
  }, []);

  return (
    <div
      className="session-expiry-overlay"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="session-expiry-title"
      aria-describedby="session-expiry-desc"
      onClick={(e) => { if (e.target === e.currentTarget) onExtend(); }}
    >
      <div className="session-expiry-modal animate-slide-up">
        <span className="session-expiry-modal__icon" aria-hidden="true">⏰</span>
        <h2 id="session-expiry-title" className="session-expiry-modal__title">
          ¿Sigues ahí?
        </h2>
        <p id="session-expiry-desc" className="session-expiry-modal__desc">
          Tu sesión expirará por inactividad. Extiéndela para no perder tu sesión.
        </p>

        <div className="session-expiry-modal__countdown" aria-live="polite" aria-atomic="true">
          {secondsRemaining}
        </div>
        <div className="session-expiry-modal__countdown-label">
          segundos restantes
        </div>

        <div className="session-expiry-modal__actions">
          <button
            ref={extendRef}
            type="button"
            className="btn btn-primary btn-lg"
            onClick={onExtend}
            id="btn-extend-session"
          >
            Extender sesión
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onLogout}
            id="btn-logout-session"
          >
            Cerrar sesión ahora
          </button>
        </div>
      </div>
    </div>
  );
}
