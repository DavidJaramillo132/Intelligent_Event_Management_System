import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import AlertMessage from '../../components/ui/AlertMessage';
import './attendee.css';

/* ── Types ─────────────────────────────────────────────────────────────── */

interface Pregunta {
  id: number;
  encuesta_id: number;
  texto_pregunta: string;
  tipo_pregunta: 'escala' | 'texto' | 'opcion_multiple';
  requerido: boolean;
  opciones?: string;
  orden: number;
}

interface Encuesta {
  id: number;
  evento_id: string;
  titulo: string;
  descripcion?: string;
  activo: boolean;
  preguntas: Pregunta[];
}

type Respuesta = { pregunta_id: number; respuesta: string; puntaje_numerico?: number };

/* ── Helpers ───────────────────────────────────────────────────────────── */

const SURVEY_SUBMITTED_KEY = (encuestaId: number, inscripcionId?: string) =>
  `survey_submitted_${encuestaId}_${inscripcionId ?? 'anon'}`;

/* ── StarRating ─────────────────────────────────────────────────────────── */

function StarRating({
  preguntaId,
  value,
  onChange,
}: {
  preguntaId: number;
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div
      className="star-rating"
      role="radiogroup"
      aria-label="Calificación de 1 a 5 estrellas"
    >
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          className="star-rating__btn"
          aria-label={`${star} estrella${star !== 1 ? 's' : ''}`}
          aria-pressed={value === star}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          id={`star-${preguntaId}-${star}`}
        >
          <span
            className={`star-rating__star ${(hovered || value) >= star ? 'star-rating__star--active' : ''}`}
            aria-hidden="true"
          >
            ★
          </span>
        </button>
      ))}
      {value > 0 && (
        <span aria-live="polite" className="sr-only">
          Calificación seleccionada: {value} de 5 estrellas
        </span>
      )}
    </div>
  );
}

/* ── LikertScale ─────────────────────────────────────────────────────────── */

function LikertScale({
  preguntaId,
  value,
  onChange,
}: {
  preguntaId: number;
  value: number;
  onChange: (v: number) => void;
}) {
  const options = [
    { v: 1, label: '1', desc: 'Muy insatisfecho' },
    { v: 2, label: '2', desc: 'Insatisfecho' },
    { v: 3, label: '3', desc: 'Neutral' },
    { v: 4, label: '4', desc: 'Satisfecho' },
    { v: 5, label: '5', desc: 'Muy satisfecho' },
  ];

  return (
    <div
      className="likert-scale"
      role="radiogroup"
      aria-label="Escala del 1 al 5"
    >
      {options.map(opt => (
        <div key={opt.v} className="likert-option">
          <input
            type="radio"
            id={`likert-${preguntaId}-${opt.v}`}
            name={`likert-${preguntaId}`}
            value={opt.v}
            checked={value === opt.v}
            onChange={() => onChange(opt.v)}
            aria-label={`${opt.label} — ${opt.desc}`}
          />
          <label
            htmlFor={`likert-${preguntaId}-${opt.v}`}
            className="likert-option__label"
            title={opt.desc}
          >
            {opt.label}
          </label>
        </div>
      ))}
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────────────── */

export default function SurveyPage() {
  const { eventoId, inscripcionId } = useParams<{ eventoId: string; inscripcionId?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [encuesta, setEncuesta] = useState<Encuesta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [respuestas, setRespuestas] = useState<Record<number, Respuesta>>({});
  const [submitted, setSubmitted] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!eventoId) return;

    const load = async () => {
      try {
        const res = await api.get<Encuesta[]>(`/encuestas/evento/${eventoId}`);
        const enc = (res.data ?? []).find(e => e.activo);
        if (!enc) {
          setError('No hay encuesta activa para este evento.');
          return;
        }
        setEncuesta(enc);

        // Check anti-duplicate via localStorage
        const key = SURVEY_SUBMITTED_KEY(enc.id, inscripcionId ?? user?.id);
        if (localStorage.getItem(key) === 'true') {
          setAlreadySubmitted(true);
        }
      } catch {
        setError('Error al cargar la encuesta.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [eventoId, inscripcionId, user]);

  const setRespuesta = (preguntaId: number, respuesta: string, puntaje?: number) => {
    setRespuestas(prev => ({
      ...prev,
      [preguntaId]: { pregunta_id: preguntaId, respuesta, puntaje_numerico: puntaje },
    }));
    // Clear validation error
    if (validationErrors[preguntaId]) {
      setValidationErrors(p => { const c = { ...p }; delete c[preguntaId]; return c; });
    }
  };

  const validate = (): boolean => {
    if (!encuesta) return false;
    const errs: Record<number, string> = {};
    encuesta.preguntas.forEach(p => {
      if (p.requerido) {
        const r = respuestas[p.id];
        if (!r || r.respuesta === '') {
          errs[p.id] = 'Esta pregunta es obligatoria';
        }
      }
    });
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!encuesta) return;
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);

    const payload = {
      encuesta_id: encuesta.id,
      inscripcion_id: inscripcionId || undefined,
      respuestas: Object.values(respuestas).map(r => ({
        pregunta_id: r.pregunta_id,
        respuesta: r.respuesta,
        puntaje_numerico: r.puntaje_numerico,
      })),
    };

    try {
      await api.post('/encuestas/responder', payload);

      // Mark as submitted in localStorage (anti-duplicate)
      const key = SURVEY_SUBMITTED_KEY(encuesta.id, inscripcionId ?? user?.id);
      localStorage.setItem(key, 'true');

      setSubmitted(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al enviar la encuesta';
      if (msg.includes('409') || msg.toLowerCase().includes('ya has respondido') || msg.toLowerCase().includes('already')) {
        setAlreadySubmitted(true);
      } else {
        setSubmitError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Cargando encuesta..." />;

  // Already submitted state
  if (alreadySubmitted) {
    return (
      <main id="main-content" className="survey-page">
        <div className="container survey-card">
          <div className="card survey-submitted">
            <span className="survey-submitted__icon" aria-hidden="true">✅</span>
            <h1 className="survey-submitted__title">¡Ya respondiste!</h1>
            <p className="survey-submitted__desc">
              Ya hemos recibido tus respuestas para este evento. ¡Gracias por tu feedback!
            </p>
            <button type="button" className="btn btn-primary" onClick={() => navigate('/')}>
              Volver al inicio
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Submitted state
  if (submitted) {
    return (
      <main id="main-content" className="survey-page">
        <div className="container survey-card">
          <div className="card survey-submitted" role="status" aria-live="polite">
            <span className="survey-submitted__icon" aria-hidden="true">🎉</span>
            <h1 className="survey-submitted__title">¡Gracias por tu opinión!</h1>
            <p className="survey-submitted__desc">
              Tus respuestas nos ayudan a mejorar la calidad de nuestros eventos.
            </p>
            <button type="button" className="btn btn-primary" onClick={() => navigate('/')}>
              Volver al inicio
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (error || !encuesta) {
    return (
      <main id="main-content" className="survey-page">
        <div className="container">
          <AlertMessage type="error" message={error ?? 'Encuesta no disponible'} />
          <button className="btn btn-ghost" onClick={() => navigate('/')} style={{ marginTop: 'var(--space-4)', color: '#fff' }}>
            Volver al inicio
          </button>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="survey-page">
      <div className="container">
        <div className="survey-card animate-slide-up">

          {/* Header */}
          <header className="survey-header">
            <span className="survey-header__icon" aria-hidden="true">📋</span>
            <h1 className="survey-header__title">{encuesta.titulo}</h1>
            {encuesta.descripcion && (
              <p className="survey-header__subtitle">{encuesta.descripcion}</p>
            )}
          </header>

          {/* Form */}
          <div className="survey-body">
            {submitError && (
              <AlertMessage type="error" message={submitError} onClose={() => setSubmitError(null)} />
            )}

            <form onSubmit={handleSubmit} noValidate aria-label={`Encuesta: ${encuesta.titulo}`}>
              {encuesta.preguntas
                .sort((a, b) => a.orden - b.orden)
                .map((pregunta) => {
                  const currentVal = respuestas[pregunta.id];
                  const hasError = !!validationErrors[pregunta.id];
                  const errorId = `error-${pregunta.id}`;

                  return (
                    <div
                      key={pregunta.id}
                      className="survey-question"
                      role="group"
                      aria-labelledby={`q-label-${pregunta.id}`}
                    >
                      <p
                        id={`q-label-${pregunta.id}`}
                        className="survey-question__text"
                      >
                        {pregunta.texto_pregunta}
                        {pregunta.requerido && (
                          <span
                            className="survey-question__required"
                            aria-label="obligatoria"
                            title="Pregunta obligatoria"
                          >
                            *
                          </span>
                        )}
                      </p>

                      {/* Escala de estrellas */}
                      {pregunta.tipo_pregunta === 'escala' && (
                        <div aria-describedby={hasError ? errorId : undefined}>
                          <StarRating
                            preguntaId={pregunta.id}
                            value={currentVal?.puntaje_numerico ?? 0}
                            onChange={(v) => setRespuesta(pregunta.id, String(v), v)}
                          />
                          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
                            {currentVal?.puntaje_numerico === 1 ? 'Muy insatisfecho' :
                             currentVal?.puntaje_numerico === 2 ? 'Insatisfecho' :
                             currentVal?.puntaje_numerico === 3 ? 'Neutral' :
                             currentVal?.puntaje_numerico === 4 ? 'Satisfecho' :
                             currentVal?.puntaje_numerico === 5 ? 'Muy satisfecho' : ''}
                          </p>
                        </div>
                      )}

                      {/* Escala Likert con números */}
                      {pregunta.tipo_pregunta === 'opcion_multiple' && !pregunta.opciones && (
                        <div aria-describedby={hasError ? errorId : undefined}>
                          <LikertScale
                            preguntaId={pregunta.id}
                            value={currentVal?.puntaje_numerico ?? 0}
                            onChange={(v) => setRespuesta(pregunta.id, String(v), v)}
                          />
                        </div>
                      )}

                      {/* Opción múltiple con opciones definidas */}
                      {pregunta.tipo_pregunta === 'opcion_multiple' && pregunta.opciones && (() => {
                        let opts: string[] = [];
                        try { opts = JSON.parse(pregunta.opciones); } catch { opts = []; }
                        return (
                          <div
                            className="likert-scale"
                            role="radiogroup"
                            aria-labelledby={`q-label-${pregunta.id}`}
                            aria-describedby={hasError ? errorId : undefined}
                          >
                            {opts.map((opt, idx) => (
                              <div key={idx} className="likert-option">
                                <input
                                  type="radio"
                                  id={`opt-${pregunta.id}-${idx}`}
                                  name={`opt-${pregunta.id}`}
                                  value={opt}
                                  checked={currentVal?.respuesta === opt}
                                  onChange={() => setRespuesta(pregunta.id, opt)}
                                  aria-label={opt}
                                />
                                <label
                                  htmlFor={`opt-${pregunta.id}-${idx}`}
                                  className="likert-option__label"
                                  style={{ fontSize: 'var(--font-size-sm)', minWidth: 'auto', padding: 'var(--space-3)' }}
                                >
                                  {opt}
                                </label>
                              </div>
                            ))}
                          </div>
                        );
                      })()}

                      {/* Texto libre */}
                      {pregunta.tipo_pregunta === 'texto' && (
                        <div>
                          <label htmlFor={`text-${pregunta.id}`} className="sr-only">
                            {pregunta.texto_pregunta}
                          </label>
                          <textarea
                            id={`text-${pregunta.id}`}
                            className="survey-textarea"
                            rows={4}
                            placeholder="Escribe tu respuesta aquí..."
                            value={currentVal?.respuesta ?? ''}
                            onChange={(e) => setRespuesta(pregunta.id, e.target.value)}
                            aria-required={pregunta.requerido}
                            aria-invalid={hasError}
                            aria-describedby={hasError ? errorId : undefined}
                          />
                        </div>
                      )}

                      {/* Validation error */}
                      {hasError && (
                        <p
                          id={errorId}
                          role="alert"
                          style={{
                            color: 'var(--color-error)',
                            fontSize: 'var(--font-size-sm)',
                            marginTop: 'var(--space-2)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-1)',
                          }}
                        >
                          <span aria-hidden="true">⚠️</span>
                          {validationErrors[pregunta.id]}
                        </p>
                      )}
                    </div>
                  );
                })}

              <div style={{ marginTop: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <button
                  type="submit"
                  className="btn btn-primary btn-lg btn-block"
                  disabled={submitting}
                  aria-busy={submitting}
                  id="btn-submit-survey"
                >
                  {submitting ? (
                    <><span className="btn-spinner" aria-hidden="true" /> Enviando...</>
                  ) : '📤 Enviar encuesta'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-block"
                  onClick={() => navigate('/')}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
