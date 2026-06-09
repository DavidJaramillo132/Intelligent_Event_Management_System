import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export default function LoadingSpinner({ size = 'md', message = 'Cargando...' }: LoadingSpinnerProps) {
  return (
    <div className="spinner-wrapper" role="status" aria-live="polite">
      <div className={`spinner spinner--${size}`} aria-hidden="true" />
      <span className="sr-only">{message}</span>
      {message && <p className="spinner__text">{message}</p>}
    </div>
  );
}
