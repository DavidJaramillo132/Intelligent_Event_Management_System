import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import FormField from '../../components/ui/FormField';
import FormFieldset from '../../components/ui/FormFieldset';
import AlertMessage from '../../components/ui/AlertMessage';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { validateRequired, validateEmail } from '../../utils/validators';
import '../attendee/attendee.css';
import './registration.css';

/* ── Types ─────────────────────────────────────────────────────────────── */

interface Evento {
  id: string;
  titulo: string;
  descripcion: string;
  inicio: string;
  fin: string;
  capacidad: number;
  costo: number;
  estado: string;
  imagen_portada?: string;
  lugar_id?: string;
}

interface TipoEntrada {
  id: string;
  nombre: string;
  precio: number;
  cupos_total: number;
  cupos_usados: number;
  disponible: boolean;
  descripcion?: string;
}

interface Disponibilidad {
  capacidad_total: number;
  inscritos: number;
  cupos_disponibles: number;
  tipos_entrada: TipoEntrada[];
}

interface InscripcionResponse {
  id: string;
  boleto?: {
    id: string;
    codigo_boleto: string;
    codigo_qr: string;
  };
}

const A11Y_OPTIONS = [
  { value: 'silla_ruedas', label: 'Silla de ruedas', icon: '♿', desc: 'Requiero acceso por rampa y espacio para silla de ruedas' },
  { value: 'baja_vision', label: 'Baja visión', icon: '👁️', desc: 'Requiero materiales en letra grande o braille' },
  { value: 'baja_audicion', label: 'Hipoacusia/Sordera', icon: '👂', desc: 'Requiero intérprete de lengua de señas o subtítulos' },
  { value: 'dieta_especial', label: 'Dieta especial', icon: '🍽️', desc: 'Requiero opciones de comida específica' },
  { value: 'otro', label: 'Otro requerimiento', icon: '📋', desc: 'Otro requerimiento de accesibilidad' },
];

/* ── CapacityModal ─────────────────────────────────────────────────────── */

function CapacityModal({ onClose, onExplore }: { onClose: () => void; onExplore: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    modalRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="capacity-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="capacity-modal-title"
      aria-describedby="capacity-modal-desc"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="capacity-modal"
        ref={modalRef}
        tabIndex={-1}
      >
        <span className="capacity-modal__icon" aria-hidden="true">😔</span>
        <h2 id="capacity-modal-title" className="capacity-modal__title">
          Sin cupos disponibles
        </h2>
        <p id="capacity-modal-desc" className="capacity-modal__desc">
          Lo sentimos, el aforo de este evento ya está completo al momento de procesar tu solicitud.
          Esto puede ocurrir cuando varios usuarios se inscriben al mismo tiempo.
        </p>
        <div className="capacity-modal__actions">
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={onExplore}
            id="modal-explore-btn"
          >
            🔍 Explorar otros eventos
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-block"
            onClick={onClose}
            id="modal-close-btn"
          >
            Volver al evento
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────────────────── */

export default function EventRegistrationPage() {
  const { eventoId } = useParams<{ eventoId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [disponibilidad, setDisponibilidad] = useState<Disponibilidad | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [inscripcionId, setInscripcionId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showCapacityModal, setShowCapacityModal] = useState(false);

  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 4;

  const [form, setForm] = useState({
    nombre: user?.nombre ? `${user.nombre} ${user.apellido || ''}`.trim() : '',
    correo: user?.correo_electronico || '',
    telefono: user?.telefono || '',
    tipo_entrada_id: '',
    a11y_seleccionadas: [] as string[],
    a11y_notas: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const [eventoRes, dispRes] = await Promise.all([
          api.get<Evento>(`/eventos/${eventoId}`),
          api.get<Disponibilidad>(`/eventos/${eventoId}/disponibilidad`),
        ]);
        setEvento(eventoRes.data || null);
        setDisponibilidad(dispRes.data || null);
      } catch {
        setSubmitError('No se pudo cargar la información del evento');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [eventoId]);

  // Poll availability every 30s
  useEffect(() => {
    if (!eventoId) return;
    const iv = setInterval(async () => {
      try {
        const r = await api.get<Disponibilidad>(`/eventos/${eventoId}/disponibilidad`);
        if (r.data) setDisponibilidad(r.data);
      } catch { /* silent */ }
    }, 30000);
    return () => clearInterval(iv);
  }, [eventoId]);

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    const nameErr = validateRequired(form.nombre, 'Nombre completo');
    if (nameErr) e.nombre = nameErr;
    const emailErr = validateEmail(form.correo);
    if (emailErr) e.correo = emailErr;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    const e: Record<string, string> = {};
    if (!form.tipo_entrada_id && disponibilidad?.tipos_entrada.length) {
      e.tipo_entrada_id = 'Seleccione un tipo de entrada';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 3 && !validateStep3()) return;
    setStep(s => Math.min(s + 1, TOTAL_STEPS));
  };

  const goPrev = () => setStep(s => Math.max(s - 1, 1));

  const toggleA11y = (val: string) => {
    setForm(p => ({
      ...p,
      a11y_seleccionadas: p.a11y_seleccionadas.includes(val)
        ? p.a11y_seleccionadas.filter(v => v !== val)
        : [...p.a11y_seleccionadas, val],
    }));
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    const reqs = [
      ...form.a11y_seleccionadas.map(v => A11Y_OPTIONS.find(o => o.value === v)?.label).filter(Boolean),
      form.a11y_notas,
    ].filter(Boolean).join('; ');

    try {
      const res = await api.post<InscripcionResponse>('/inscripciones', {
        evento_id: eventoId,
        asistente_id: user?.id,
        tipo_entrada_id: form.tipo_entrada_id || undefined,
        requerimientos_accesibilidad: reqs || undefined,
      });
      setInscripcionId(res.data?.id ?? null);
      setSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al inscribirse';
      if (msg.toLowerCase().includes('aforo') || msg.toLowerCase().includes('cupo') || msg.includes('409') || msg.includes('capacity')) {
        setShowCapacityModal(true);
      } else {
        setSubmitError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (ds: string) => new Date(ds).toLocaleDateString('es-EC', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const selectedEntry = disponibilidad?.tipos_entrada.find(t => t.id === form.tipo_entrada_id);

  if (loading) return <LoadingSpinner message="Cargando evento..." />;
  if (!evento) return (
    <main className="reg-page" id="main-content">
      <div className="container">
        <AlertMessage type="error" message="Evento no encontrado" />
      </div>
    </main>
  );

  const STEPS = ['Datos personales', 'Accesibilidad', 'Tipo de entrada', 'Revisión'];

  return (
    <main className="reg-page" id="main-content">
      <div className="container">

        {/* ── Event Info ───────────────────────────────────────────────── */}
        <section className="reg-event-info card animate-fade-in" aria-label="Información del evento">
          {evento.imagen_portada && (
            <img src={evento.imagen_portada} alt={`Portada: ${evento.titulo}`} className="reg-event-info__image" />
          )}
          <div className="reg-event-info__content">
            <h1 className="reg-event-info__title">{evento.titulo}</h1>
            <div className="reg-event-info__meta">
              <span className="reg-event-info__meta-item">
                <span aria-hidden="true">📅</span> {formatDate(evento.inicio)}
              </span>
              <span className="reg-event-info__meta-item">
                <span aria-hidden="true">👥</span>{' '}
                {disponibilidad
                  ? `${disponibilidad.cupos_disponibles} cupos de ${disponibilidad.capacidad_total}`
                  : `Capacidad: ${evento.capacidad}`}
              </span>
            </div>
          </div>
        </section>

        {/* ── Stepper ──────────────────────────────────────────────────── */}
        <nav
          className="reg-steps"
          aria-label="Progreso de inscripción"
          role="navigation"
        >
          {STEPS.map((label, i) => (
            <div
              key={i}
              className={`reg-steps__step ${step > i + 1 ? 'reg-steps__step--done' : ''} ${step === i + 1 ? 'reg-steps__step--active' : ''}`}
              aria-current={step === i + 1 ? 'step' : undefined}
            >
              <span className="reg-steps__number" aria-hidden="true">
                {step > i + 1 ? '✓' : i + 1}
              </span>
              <span className="reg-steps__label">{label}</span>
            </div>
          ))}
        </nav>

        {submitError && <AlertMessage type="error" message={submitError} onClose={() => setSubmitError(null)} />}

        {/* ── Capacity Modal ───────────────────────────────────────────── */}
        {showCapacityModal && (
          <CapacityModal
            onClose={() => setShowCapacityModal(false)}
            onExplore={() => navigate('/eventos')}
          />
        )}

        {/* ── Success ──────────────────────────────────────────────────── */}
        {success ? (
          <div className="reg-success card animate-slide-up" role="status" aria-live="polite">
            <div className="reg-success__icon" aria-hidden="true">🎉</div>
            <h2>¡Inscripción Exitosa!</h2>
            <p>Te has inscrito correctamente al evento <strong>{evento.titulo}</strong>.</p>
            {selectedEntry && (
              <p>Entrada: <strong>{selectedEntry.nombre}</strong> — {selectedEntry.precio === 0 ? 'Gratis' : `$${selectedEntry.precio.toFixed(2)}`}</p>
            )}
            <p className="reg-success__hint">Recibirás un correo de confirmación con tu boleto digital.</p>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', justifyContent: 'center' }}>
              {inscripcionId && (
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => navigate(`/mi-boleto/${inscripcionId}`)}
                  type="button"
                  id="btn-ver-boleto"
                >
                  🎫 Ver mi boleto
                </button>
              )}
              <button className="btn btn-ghost btn-lg" onClick={() => navigate('/')} type="button">
                Volver al inicio
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="reg-form card animate-slide-up" aria-live="polite">

            {/* ── PASO 1: Datos Personales ─────────────────────────────── */}
            {step === 1 && (
              <FormFieldset legend="Paso 1 de 4 — Datos Personales">
                <FormField
                  id="reg-nombre"
                  label="Nombre completo"
                  type="text"
                  autoComplete="name"
                  required
                  value={form.nombre}
                  onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                  error={errors.nombre}
                  placeholder="Nombre Apellido"
                />
                <FormField
                  id="reg-correo"
                  label="Correo electrónico"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.correo}
                  onChange={e => setForm(p => ({ ...p, correo: e.target.value }))}
                  error={errors.correo}
                  placeholder="tu@correo.com"
                />
                <FormField
                  id="reg-telefono"
                  label="Teléfono"
                  type="tel"
                  autoComplete="tel"
                  value={form.telefono}
                  onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))}
                  placeholder="+593 999 999 999"
                  helpText="Opcional — para recordatorios"
                />
                <div className="reg-form__actions">
                  <button type="button" className="btn btn-primary btn-lg btn-block" onClick={goNext} id="btn-paso1">
                    Continuar →
                  </button>
                </div>
              </FormFieldset>
            )}

            {/* ── PASO 2: Requerimientos de Accesibilidad ──────────────── */}
            {step === 2 && (
              <FormFieldset legend="Paso 2 de 4 — Requerimientos de Accesibilidad">
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-sm)' }}>
                  Opcional — Cuéntanos si tienes algún requerimiento especial para que podamos ayudarte mejor el día del evento.
                </p>

                <div
                  className="a11y-options"
                  role="group"
                  aria-label="Seleccione sus requerimientos de accesibilidad"
                >
                  {A11Y_OPTIONS.map(opt => (
                    <label
                      key={opt.value}
                      className={`a11y-option ${form.a11y_seleccionadas.includes(opt.value) ? 'a11y-option--selected' : ''}`}
                      style={{
                        borderColor: form.a11y_seleccionadas.includes(opt.value) ? 'var(--color-primary)' : undefined,
                        background: form.a11y_seleccionadas.includes(opt.value) ? 'var(--color-primary-surface)' : undefined,
                      }}
                    >
                      <input
                        type="checkbox"
                        value={opt.value}
                        checked={form.a11y_seleccionadas.includes(opt.value)}
                        onChange={() => toggleA11y(opt.value)}
                        aria-describedby={`a11y-desc-${opt.value}`}
                        style={{ marginRight: 0 }}
                      />
                      <span className="a11y-option__icon" aria-hidden="true">{opt.icon}</span>
                      <span className="a11y-option__content">
                        <span className="a11y-option__label">{opt.label}</span>
                        <span id={`a11y-desc-${opt.value}`} className="a11y-option__desc">{opt.desc}</span>
                      </span>
                    </label>
                  ))}
                </div>

                <div className="a11y-textarea" style={{ marginTop: 'var(--space-5)' }}>
                  <label htmlFor="reg-a11y-notas" style={{ display: 'block', fontWeight: 600, marginBottom: 'var(--space-2)', fontSize: 'var(--font-size-sm)' }}>
                    Notas adicionales (opcional)
                  </label>
                  <textarea
                    id="reg-a11y-notas"
                    rows={3}
                    placeholder="Describe cualquier requerimiento adicional que necesites..."
                    value={form.a11y_notas}
                    onChange={e => setForm(p => ({ ...p, a11y_notas: e.target.value }))}
                    aria-describedby="a11y-notas-hint"
                    style={{ width: '100%' }}
                  />
                  <p id="a11y-notas-hint" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
                    Esta información se comparte con los organizadores del evento.
                  </p>
                </div>

                <div className="reg-form__actions reg-form__actions--split">
                  <button type="button" className="btn btn-ghost btn-lg" onClick={goPrev}>← Atrás</button>
                  <button type="button" className="btn btn-primary btn-lg" onClick={goNext} id="btn-paso2">
                    Continuar →
                  </button>
                </div>
              </FormFieldset>
            )}

            {/* ── PASO 3: Tipo de Entrada ──────────────────────────────── */}
            {step === 3 && (
              <FormFieldset legend="Paso 3 de 4 — Tipo de Entrada">
                {errors.tipo_entrada_id && (
                  <AlertMessage type="warning" message={errors.tipo_entrada_id} />
                )}

                <div className="reg-entries" role="radiogroup" aria-label="Tipos de entrada disponibles">
                  {disponibilidad?.tipos_entrada.map(te => {
                    const sinDisp = !te.disponible;
                    const cuposRest = te.cupos_total - te.cupos_usados;
                    return (
                      <label
                        key={te.id}
                        className={`reg-entry ${form.tipo_entrada_id === te.id ? 'reg-entry--selected' : ''} ${sinDisp ? 'reg-entry--unavailable' : ''}`}
                        htmlFor={`entry-${te.id}`}
                      >
                        <input
                          type="radio"
                          id={`entry-${te.id}`}
                          name="tipo_entrada"
                          value={te.id}
                          checked={form.tipo_entrada_id === te.id}
                          onChange={() => setForm(p => ({ ...p, tipo_entrada_id: te.id }))}
                          disabled={sinDisp}
                          aria-describedby={sinDisp ? `entry-unavail-${te.id}` : undefined}
                        />
                        <div className="reg-entry__content">
                          <div className="reg-entry__header">
                            <span className="reg-entry__name">{te.nombre}</span>
                            <span className="reg-entry__price">
                              {te.precio === 0 ? 'Gratis' : `$${te.precio.toFixed(2)}`}
                            </span>
                          </div>
                          {sinDisp ? (
                            <span id={`entry-unavail-${te.id}`} className="reg-entry__unavailable">
                              <span aria-hidden="true">⊘</span> Sin disponibilidad
                            </span>
                          ) : (
                            <span className="reg-entry__slots">
                              <span aria-hidden="true">✓</span> {cuposRest} cupos disponibles
                            </span>
                          )}
                          {te.descripcion && <p className="reg-entry__desc">{te.descripcion}</p>}
                        </div>
                      </label>
                    );
                  })}

                  {(!disponibilidad?.tipos_entrada || disponibilidad.tipos_entrada.length === 0) && (
                    <div className="reg-entries__empty">
                      <p>Sin tipos de entrada configurados. Continúe para inscribirse gratuitamente.</p>
                    </div>
                  )}
                </div>

                <div className="reg-form__actions reg-form__actions--split">
                  <button type="button" className="btn btn-ghost btn-lg" onClick={goPrev}>← Atrás</button>
                  <button type="button" className="btn btn-primary btn-lg" onClick={goNext} id="btn-paso3">
                    Continuar →
                  </button>
                </div>
              </FormFieldset>
            )}

            {/* ── PASO 4: Revisión ─────────────────────────────────────── */}
            {step === 4 && (
              <fieldset className="reg-confirm">
                <legend>Paso 4 de 4 — Revisión y Confirmación</legend>
                <div className="reg-confirm__summary">
                  <h3>Resumen de inscripción</h3>
                  <dl className="reg-confirm__details">
                    <div className="reg-confirm__detail">
                      <dt>Evento</dt><dd>{evento.titulo}</dd>
                    </div>
                    <div className="reg-confirm__detail">
                      <dt>Fecha</dt><dd>{formatDate(evento.inicio)}</dd>
                    </div>
                    <div className="reg-confirm__detail">
                      <dt>Nombre</dt><dd>{form.nombre}</dd>
                    </div>
                    <div className="reg-confirm__detail">
                      <dt>Correo</dt><dd>{form.correo}</dd>
                    </div>
                    {form.telefono && (
                      <div className="reg-confirm__detail">
                        <dt>Teléfono</dt><dd>{form.telefono}</dd>
                      </div>
                    )}
                    {form.a11y_seleccionadas.length > 0 && (
                      <div className="reg-confirm__detail">
                        <dt>Accesibilidad</dt>
                        <dd>
                          {form.a11y_seleccionadas.map(v =>
                            A11Y_OPTIONS.find(o => o.value === v)?.label
                          ).join(', ')}
                        </dd>
                      </div>
                    )}
                    {selectedEntry && (
                      <>
                        <div className="reg-confirm__detail">
                          <dt>Tipo de entrada</dt><dd>{selectedEntry.nombre}</dd>
                        </div>
                        <div className="reg-confirm__detail reg-confirm__detail--total">
                          <dt>Costo</dt>
                          <dd>{selectedEntry.precio === 0 ? 'Gratis' : `$${selectedEntry.precio.toFixed(2)}`}</dd>
                        </div>
                      </>
                    )}
                    {(!selectedEntry && evento.costo === 0) && (
                      <div className="reg-confirm__detail reg-confirm__detail--total">
                        <dt>Costo</dt><dd>Gratis</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="reg-form__actions reg-form__actions--split">
                  <button type="button" className="btn btn-ghost btn-lg" onClick={goPrev}>← Atrás</button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={submitting}
                    id="btn-inscribirme"
                    aria-busy={submitting}
                  >
                    {submitting ? (
                      <><span className="btn-spinner" aria-hidden="true" /> Procesando...</>
                    ) : '🎟️ Confirmar inscripción'}
                  </button>
                </div>
              </fieldset>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
