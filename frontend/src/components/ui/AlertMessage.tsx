import './AlertMessage.css';

type AlertType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface AlertMessageProps {
  type: AlertType;
  message: string;
  onClose?: () => void;
}

const icons: Record<AlertType, string> = {
  success: '✅',
  error: '⚠️',
  warning: '⚠️',
  info: 'ℹ️',
  loading: '⏳',
};

export default function AlertMessage({ type, message, onClose }: AlertMessageProps) {
  return (
    <div className={`alert alert--${type}`} role="alert" aria-live="polite">
      <span className="alert__icon" aria-hidden="true">{icons[type]}</span>
      <p className="alert__message">{message}</p>
      {onClose && (
        <button className="alert__close" onClick={onClose} aria-label="Cerrar alerta" type="button">
          ✕
        </button>
      )}
    </div>
  );
}
