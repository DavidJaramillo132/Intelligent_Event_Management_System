import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import FormField from '../../components/ui/FormField';
import FormFieldset from '../../components/ui/FormFieldset';
import AlertMessage from '../../components/ui/AlertMessage';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { validateRequired, validateEmail } from '../../utils/validators';
import './registration.css';

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

export default function EventRegistrationPage() {
  const { eventoId } = useParams<{ eventoId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [disponibilidad, setDisponibilidad] = useState<Disponibilidad | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [form, setForm] = useState({
    nombre: user?.nombre || '',
    correo: user?.correo_electronico || '',
    telefono: user?.telefono || '',
    tipo_entrada_id: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Current step: 1 = datos, 2 = selección, 3 = confirmación
  const [step, setStep] = useState(1);

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
    const interval = setInterval(async () => {
      try {
        const res = await api.get<Disponibilidad>(`/eventos/${eventoId}/disponibilidad`);
        if (res.data) setDisponibilidad(res.data);
      } catch { /* ignore polling errors */ }
    }, 30000);
    return () => clearInterval(interval);
  }, [eventoId]);

  const updateField = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(p => ({ ...p, [field]: e.target.value }));
  };

  const validateStep1 = (): boolean => {
    const e: Record<string, string> = {};
    const nameErr = validateRequired(form.nombre, 'Nombre completo');
    if (nameErr) e.nombre = nameErr;
    const emailErr = validateEmail(form.correo);
    if (emailErr) e.correo = emailErr;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.tipo_entrada_id) {
      e.tipo_entrada_id = 'Seleccione un tipo de entrada';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goToStep2 = () => {
    if (validateStep1()) setStep(2);
  };

  const goToStep3 = () => {
    if (validateStep2()) setStep(3);
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    try {
      await api.post('/inscripciones', {
        evento_id: eventoId,
        asistente_id: user?.id,
        tipo_entrada_id: form.tipo_entrada_id,
      });
      setSuccess(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error al inscribirse');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-EC', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const selectedEntry = disponibilidad?.tipos_entrada.find(t => t.id === form.tipo_entrada_id);

  if (loading) return <LoadingSpinner message="Cargando evento..." />;

  if (!evento) {
    return (
      <main className="reg-page" id="main-content">
        <div className="container">
          <AlertMessage type="error" message="Evento no encontrado" />
        </div>
      </main>
    );
  }

  return (
    <main className="reg-page" id="main-content">
      <div className="container">
        {/* ── Event Info Banner ────────────────────────────────────── */}
        <section className="reg-event-info card animate-fade-in" aria-label="Información del evento">
          {evento.imagen_portada && (
            <img
              src={evento.imagen_portada}
              alt={`Portada del evento: ${evento.titulo}`}
              className="reg-event-info__image"
            />
          )}
          <div className="reg-event-info__content">
            <h1 className="reg-event-info__title">{evento.titulo}</h1>
            {evento.descripcion && (
              <p className="reg-event-info__desc">{evento.descripcion}</p>
            )}
            <div className="reg-event-info__meta">
              <span className="reg-event-info__meta-item">
                <span aria-hidden="true">📅</span> {formatDate(evento.inicio)}
              </span>
              <span className="reg-event-info__meta-item">
                <span aria-hidden="true">👥</span>{' '}
                {disponibilidad ? `${disponibilidad.cupos_disponibles} cupos disponibles de ${disponibilidad.capacidad_total}` : `Capacidad: ${evento.capacidad}`}
              </span>
            </div>
          </div>
        </section>

        {/* ── Progress Steps ──────────────────────────────────────── */}
        <div className="reg-steps" aria-label="Progreso de inscripción">
          {['Datos personales', 'Tipo de entrada', 'Confirmación'].map((label, i) => (
            <div key={i} className={`reg-steps__step ${step > i + 1 ? 'reg-steps__step--done' : ''} ${step === i + 1 ? 'reg-steps__step--active' : ''}`}>
              <span className="reg-steps__number" aria-hidden="true">
                {step > i + 1 ? '✓' : i + 1}
              </span>
              <span className="reg-steps__label">{label}</span>
            </div>
          ))}
        </div>

        {submitError && <AlertMessage type="error" message={submitError} onClose={() => setSubmitError(null)} />}

        {success ? (
          <div className="reg-success card animate-slide-up">
            <div className="reg-success__icon" aria-hidden="true">🎉</div>
            <h2>¡Inscripción Exitosa!</h2>
            <p>Te has inscrito correctamente al evento <strong>{evento.titulo}</strong>.</p>
            {selectedEntry && (
              <p>Tipo de entrada: <strong>{selectedEntry.nombre}</strong> — ${selectedEntry.precio.toFixed(2)}</p>
            )}
            <p className="reg-success__hint">Recibirás un correo de confirmación con tu entrada digital.</p>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/')} type="button">
              Volver al inicio
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="reg-form card animate-slide-up">

            {/* ── Step 1: Personal Data ────────────────────────────── */}
            {step === 1 && (
              <FormFieldset legend="Datos Personales">
                <FormField
                  id="reg-nombre"
                  label="Nombre completo"
                  type="text"
                  autoComplete="name"
                  required
                  value={form.nombre}
                  onChange={updateField('nombre')}
                  error={errors.nombre}
                  placeholder="Juan Pérez"
                />

                <FormField
                  id="reg-correo"
                  label="Correo electrónico"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.correo}
                  onChange={updateField('correo')}
                  error={errors.correo}
                  placeholder="tu@correo.com"
                />

                <FormField
                  id="reg-telefono"
                  label="Teléfono"
                  type="tel"
                  autoComplete="tel"
                  value={form.telefono}
                  onChange={updateField('telefono')}
                  placeholder="+593 999 999 999"
                  helpText="Opcional — para recibir recordatorios"
                />

                <div className="reg-form__actions">
                  <button type="button" className="btn btn-primary btn-lg btn-block" onClick={goToStep2}>
                    Continuar →
                  </button>
                </div>
              </FormFieldset>
            )}

            {/* ── Step 2: Entry Type Selection ─────────────────────── */}
            {step === 2 && (
              <FormFieldset legend="Seleccione su tipo de entrada">
                {errors.tipo_entrada_id && (
                  <AlertMessage type="warning" message={errors.tipo_entrada_id} />
                )}
                <div className="reg-entries" role="radiogroup" aria-label="Tipos de entrada disponibles">
                  {disponibilidad?.tipos_entrada.map(te => {
                    const cuposRestantes = te.cupos_total - te.cupos_usados;
                    const sinDisponibilidad = !te.disponible;

                    return (
                      <label
                        key={te.id}
                        className={`reg-entry ${form.tipo_entrada_id === te.id ? 'reg-entry--selected' : ''} ${sinDisponibilidad ? 'reg-entry--unavailable' : ''}`}
                        htmlFor={`entry-${te.id}`}
                      >
                        <input
                          type="radio"
                          id={`entry-${te.id}`}
                          name="tipo_entrada"
                          value={te.id}
                          checked={form.tipo_entrada_id === te.id}
                          onChange={() => setForm(p => ({ ...p, tipo_entrada_id: te.id }))}
                          disabled={sinDisponibilidad}
                          aria-describedby={sinDisponibilidad ? `entry-unavail-${te.id}` : undefined}
                        />
                        <div className="reg-entry__content">
                          <div className="reg-entry__header">
                            <span className="reg-entry__name">{te.nombre}</span>
                            <span className="reg-entry__price">
                              {te.precio === 0 ? 'Gratis' : `$${te.precio.toFixed(2)}`}
                            </span>
                          </div>
                          {sinDisponibilidad ? (
                            <span id={`entry-unavail-${te.id}`} className="reg-entry__unavailable">
                              <span aria-hidden="true">⊘</span> Sin disponibilidad
                            </span>
                          ) : (
                            <span className="reg-entry__slots">
                              <span aria-hidden="true">✓</span> {cuposRestantes} cupos disponibles
                            </span>
                          )}
                          {te.descripcion && (
                            <p className="reg-entry__desc">{te.descripcion}</p>
                          )}
                        </div>
                      </label>
                    );
                  })}

                  {(!disponibilidad?.tipos_entrada || disponibilidad.tipos_entrada.length === 0) && (
                    <div className="reg-entries__empty">
                      <p>No hay tipos de entrada configurados para este evento.</p>
                      <p>Contacte al organizador para más información.</p>
                    </div>
                  )}
                </div>

                <div className="reg-form__actions reg-form__actions--split">
                  <button type="button" className="btn btn-ghost btn-lg" onClick={() => setStep(1)}>
                    ← Atrás
                  </button>
                  <button type="button" className="btn btn-primary btn-lg" onClick={goToStep3}>
                    Continuar →
                  </button>
                </div>
              </FormFieldset>
            )}

            {/* ── Step 3: Confirmation ─────────────────────────────── */}
            {step === 3 && (
              <fieldset className="reg-confirm">
                <legend>Confirmación de Inscripción</legend>

                <div className="reg-confirm__summary">
                  <h3>Resumen de su inscripción</h3>
                  <dl className="reg-confirm__details">
                    <div className="reg-confirm__detail">
                      <dt>Evento</dt>
                      <dd>{evento.titulo}</dd>
                    </div>
                    <div className="reg-confirm__detail">
                      <dt>Fecha</dt>
                      <dd>{formatDate(evento.inicio)}</dd>
                    </div>
                    <div className="reg-confirm__detail">
                      <dt>Nombre</dt>
                      <dd>{form.nombre}</dd>
                    </div>
                    <div className="reg-confirm__detail">
                      <dt>Correo</dt>
                      <dd>{form.correo}</dd>
                    </div>
                    {form.telefono && (
                      <div className="reg-confirm__detail">
                        <dt>Teléfono</dt>
                        <dd>{form.telefono}</dd>
                      </div>
                    )}
                    {selectedEntry && (
                      <>
                        <div className="reg-confirm__detail">
                          <dt>Tipo de entrada</dt>
                          <dd>{selectedEntry.nombre}</dd>
                        </div>
                        <div className="reg-confirm__detail reg-confirm__detail--total">
                          <dt>Costo</dt>
                          <dd>{selectedEntry.precio === 0 ? 'Gratis' : `$${selectedEntry.precio.toFixed(2)}`}</dd>
                        </div>
                      </>
                    )}
                  </dl>
                </div>

                <div className="reg-form__actions reg-form__actions--split">
                  <button type="button" className="btn btn-ghost btn-lg" onClick={() => setStep(2)}>
                    ← Atrás
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={submitting}
                    id="btn-inscribirme"
                  >
                    {submitting ? (
                      <>
                        <span className="btn-spinner" aria-hidden="true" />
                        Procesando...
                      </>
                    ) : (
                      '🎟️ Inscribirme'
                    )}
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
