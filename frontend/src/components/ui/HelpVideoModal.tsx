import { useEffect, useRef, useCallback } from 'react';
import AccessibleTooltip from './AccessibleTooltip';
import './HelpVideoModal.css';

interface HelpVideoModalProps {
  videoSrc: string;
  videoVtt?: string;
  poster?: string;
  title: string;
  description: string;
  transcription: React.ReactNode;
  onClose: () => void;
}

export default function HelpVideoModal({
  videoSrc,
  videoVtt,
  poster,
  title,
  description,
  transcription,
  onClose,
}: HelpVideoModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  const titleId = 'help-video-title';
  const descId = 'help-video-desc';

  return (
    <div
      className="help-video-overlay"
      role="presentation"
      onClick={handleOverlayClick}
    >
      <div
        className="help-video-panel animate-slide-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        ref={panelRef}
      >
        <div className="help-video-panel__header">
          <h2 id={titleId} className="help-video-panel__title">{title}</h2>
          <AccessibleTooltip content="Cerrar">
            <button
              ref={closeRef}
              type="button"
              className="help-video-panel__close"
              onClick={onClose}
              aria-label="Cerrar"
            >
              ✕
            </button>
          </AccessibleTooltip>
        </div>

        <div className="help-video-panel__body">
          <p id={descId} className="sr-only">{description}</p>

          <figure className="help-video-panel__video-wrap">
            <video
              controls
              className="help-video-panel__video"
              poster={poster}
              aria-label={title}
            >
              <source src={videoSrc} type="video/mp4" />
              {videoVtt && (
                <track
                  kind="captions"
                  src={videoVtt}
                  srcLang="es"
                  label="Español"
                  default
                />
              )}
            </video>
          </figure>

          <details className="help-video-panel__transcript">
            <summary>📄 Transcripción y descripción del video</summary>
            <div className="help-video-panel__transcript-body">
              {typeof transcription === 'string' ? <p>{transcription}</p> : transcription}
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
