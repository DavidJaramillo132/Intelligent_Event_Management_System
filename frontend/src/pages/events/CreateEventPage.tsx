import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import FormField from '../../components/ui/FormField';
import FormFieldset from '../../components/ui/FormFieldset';
import AlertMessage from '../../components/ui/AlertMessage';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { validateRequired, validateNumber } from '../../utils/validators';
import AccessibleTooltip from '../../components/ui/AccessibleTooltip';
import HelpVideoModal from '../../components/ui/HelpVideoModal';
import '../organizer/organizer.css';
import './events.css';

interface TipoEvento { id: number; nombre: string; }
interface Lugar { id: string; nombre: string; direccion: string; ciudad: string; capacidad: number; }
interface Sesion { titulo: string; inicio: string; fin: string; ponente: string; }
interface TipoEntradaForm { nombre: string; precio: string; cupos: string; }
interface Material { nombre: string; cantidad: string; estado: string; notas: string; }

const STEPS = [
  { label: 'Datos del Evento', icon: '📋' },
  { label: 'Ubicación y Fecha', icon: '📍' },
  { label: 'Agenda', icon: '🗓️' },
  { label: 'Inventario', icon: '📦' },
];

export default function CreateEventPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [eventoId, setEventoId] = useState<string | null>(null);
  const [estado, setEstado] = useState<'borrador' | 'publicado'>('borrador');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const [tiposEvento, setTiposEvento] = useState<TipoEvento[]>([]);
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [form, setForm] = useState({
    tipo_evento_id: '',
    titulo: '',
    descripcion: '',
    costo: '0',
    capacidad: '',
    inicio: '',
    fin: '',
    inicio_registro: '',
    fin_registro: '',
    lugar_id: '',
    imagen_portada: null as File | null,
    imagen_alt: '',
    imagen_preview: '',
  });

  const [tiposEntrada, setTiposEntrada] = useState<TipoEntradaForm[]>([
    { nombre: 'General', precio: '0', cupos: '100' },
  ]);
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      api.get<TipoEvento[]>('/tipos-evento'),
      api.get<Lugar[]>('/lugares'),
    ]).then(([t, l]) => {
      setTiposEvento(t.data || []);
      setLugares(l.data || []);
    }).finally(() => setLoadingData(false));
  }, []);

  const updateField = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }));

  const validateStep = useCallback((step: number): boolean => {
    const e: Record<string, string> = {};
    if (step === 0) {
      const t = validateRequired(form.titulo, 'Título');
      if (t) e.titulo = t;
      const cap = validateNumber(form.capacidad, 'Capacidad', 1);
      if (cap) e.capacidad = cap;
      if (form.imagen_portada && !form.imagen_alt.trim())
        e.imagen_alt = 'El texto alternativo es obligatorio para accesibilidad (WCAG 1.1.1)';
    }
    if (step === 1) {
      if (!form.inicio) e.inicio = 'La fecha de inicio es requerida';
      if (!form.fin) e.fin = 'La fecha de fin es requerida';
      if (form.inicio && form.fin && new Date(form.fin) <= new Date(form.inicio))
        e.fin = 'La fecha de fin debe ser posterior a la de inicio';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form]);

  // Guardar evento (crear o actualizar) asíncronamente
  const saveEvento = useCallback(async (publishEstado?: 'borrador' | 'publicado') => {
    setSaving(true);
    setSaveMsg(null);
    setSubmitError(null);
    const estadoFinal = publishEstado ?? estado;
    try {
      let imagenUrl = '';
      if (form.imagen_portada) {
        const fd = new FormData();
        fd.append('archivo', form.imagen_portada);
        const up = await api.upload<{ url: string }>('/uploads', fd);
        imagenUrl = up.data?.url || '';
        setForm(p => ({ ...p, imagen_portada: null, imagen_preview: imagenUrl }));
      }

      const body = {
        organizador_id: user?.id,
        tipo_evento_id: form.tipo_evento_id ? Number(form.tipo_evento_id) : 1,
        lugar_id: form.lugar_id || undefined,
        titulo: form.titulo,
        descripcion: form.descripcion,
        inicio: form.inicio ? new Date(form.inicio).toISOString() : new Date().toISOString(),
        fin: form.fin ? new Date(form.fin).toISOString() : new Date().toISOString(),
        capacidad: Number(form.capacidad) || 100,
        costo: Number(form.costo) || 0,
        estado: estadoFinal,
        imagen_portada: imagenUrl || undefined,
      };

      if (eventoId) {
        await api.put(`/eventos/${eventoId}`, body);
      } else {
        const res = await api.post<{ id: string }>('/eventos', body);
        const newId = res.data?.id;
        if (newId) {
          setEventoId(newId);
          // Crear tipos de entrada iniciales
          for (const te of tiposEntrada) {
            if (te.nombre.trim()) {
              await api.post(`/eventos/${newId}/tipos-entrada`, {
                nombre: te.nombre,
                precio: Number(te.precio),
                cupos_total: Number(te.cupos),
              });
            }
          }
        }
      }
      setEstado(estadoFinal);
      setSaveMsg(estadoFinal === 'publicado' ? '✅ Evento publicado exitosamente' : '💾 Guardado como borrador');
      setTimeout(() => setSaveMsg(null), 3000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error al guardar el evento');
    } finally {
      setSaving(false);
    }
  }, [eventoId, form, estado, tiposEntrada, user?.id]);

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;
    if (currentStep === 0 || currentStep === 1) {
      await saveEvento();
    }
    setCurrentStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const handlePrev = () => setCurrentStep(s => Math.max(s - 1, 0));

  const handleFinish = async (e: FormEvent) => {
    e.preventDefault();
    if (!eventoId) {
      await saveEvento();
    }
    // Guardar sesiones y materiales si hay evento
    if (eventoId || true) {
      try {
        for (let i = 0; i < sesiones.length; i++) {
          const s = sesiones[i];
          if (s.titulo.trim() && eventoId) {
            await api.post(`/eventos/${eventoId}/sesiones`, {
              titulo: s.titulo,
              inicio: s.inicio ? new Date(s.inicio).toISOString() : new Date(form.inicio || Date.now()).toISOString(),
              fin: s.fin ? new Date(s.fin).toISOString() : new Date(form.fin || Date.now()).toISOString(),
              ponente: s.ponente,
              orden: i,
            });
          }
        }
        for (const m of materiales) {
          if (m.nombre.trim() && eventoId) {
            await api.post('/materiales', {
              evento_id: eventoId,
              nombre: m.nombre,
              cantidad: Number(m.cantidad) || 1,
              notas: m.notas,
            });
          }
        }
      } catch { /* materiales/sesiones son opcionales */ }
    }
    navigate('/organizador');
  };

  if (loadingData) return <LoadingSpinner message="Cargando datos..." />;

  return (
    <div className="stepper-page" id="main-content">
      {/* ── Barra de estado superior ─── */}
      <div className="stepper-statusbar" role="banner" aria-label="Estado del evento">
        <div className="container stepper-statusbar__inner">
          <span className="stepper-statusbar__title">
            {eventoId ? '✎ Editar evento' : '＋ Nuevo evento'}
            <AccessibleTooltip content="Ver tutorial">
              <button
                type="button"
                className="btn-help-video btn-help-video--sm"
                onClick={() => setShowHelp(true)}
                aria-label="Ver tutorial de creación de eventos"
                style={{ marginLeft: '0.5rem' }}
              >
                ❓
              </button>
            </AccessibleTooltip>
            {form.titulo && <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>— {form.titulo}</span>}
          </span>
          <div className="stepper-statusbar__right">
            {saveMsg && (
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-success)', fontWeight: 600 }} role="status" aria-live="polite">
                {saveMsg}
              </span>
            )}
            <div className="stepper-status-toggle" role="group" aria-label="Estado del evento">
              <button
                type="button"
                className={estado === 'borrador' ? 'active-borrador' : ''}
                onClick={() => saveEvento('borrador')}
                disabled={saving}
                id="btn-estado-borrador"
                aria-pressed={estado === 'borrador'}
              >
                ✎ Borrador
              </button>
              <button
                type="button"
                className={estado === 'publicado' ? 'active-publicado' : ''}
                onClick={() => { if (validateStep(0)) saveEvento('publicado'); }}
                disabled={saving || !form.titulo}
                id="btn-estado-publicado"
                aria-pressed={estado === 'publicado'}
              >
                ✓ Publicar
              </button>
            </div>
            {saving && <span className="btn-spinner" aria-label="Guardando..." aria-busy="true" />}
          </div>
        </div>
      </div>

      {/* ── Navegación del stepper ─── */}
      <nav className="stepper-nav container" aria-label="Pasos del formulario">
        <ol className="stepper-nav__steps" role="list">
          {STEPS.map((step, i) => (
            <li key={i} className="stepper-nav__step">
              <button
                type="button"
                className={`stepper-nav__step-btn ${i === currentStep ? 'current' : ''} ${i < currentStep ? 'done' : ''}`}
                onClick={() => i < currentStep && setCurrentStep(i)}
                aria-current={i === currentStep ? 'step' : undefined}
                aria-label={`Paso ${i + 1}: ${step.label}${i < currentStep ? ' (completado)' : ''}`}
                disabled={i > currentStep}
                id={`step-btn-${i}`}
              >
                <span className="stepper-nav__step-num" aria-hidden="true">
                  {i < currentStep ? '✓' : i + 1}
                </span>
                <span className="step-label">{step.icon} {step.label}</span>
              </button>
              {i < STEPS.length - 1 && <div className="stepper-nav__connector" aria-hidden="true" />}
            </li>
          ))}
        </ol>
      </nav>

      {/* ── Errores globales ─── */}
      <div className="container">
        {submitError && <AlertMessage type="error" message={submitError} onClose={() => setSubmitError(null)} />}
      </div>

      {/* ── Contenido del paso ─── */}
      <form onSubmit={handleFinish} noValidate>
        <div className="stepper-content container">

          {/* ── PASO 1: Datos del Evento ─── */}
          {currentStep === 0 && (
            <FormFieldset legend="Datos del Evento">
              <FormField id="ev-tipo" label="Tipo de evento" as="select" value={form.tipo_evento_id} onChange={updateField('tipo_evento_id')}>
                <option value="">Seleccione un tipo</option>
                {tiposEvento.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </FormField>
              <FormField id="ev-titulo" label="Título del evento" type="text" required
                value={form.titulo} onChange={updateField('titulo')} error={errors.titulo}
                placeholder="Conferencia de Innovación 2026" />
              <FormField id="ev-desc" label="Descripción" as="textarea"
                value={form.descripcion} onChange={updateField('descripcion')}
                placeholder="Describe el evento para los asistentes..." />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <FormField id="ev-costo" label="Costo base ($)" type="number" min={0} step={0.01}
                  value={form.costo} onChange={updateField('costo')} placeholder="0.00" />
                <FormField id="ev-capacidad" label="Aforo máximo" type="number" required min={1}
                  value={form.capacidad} onChange={updateField('capacidad')} error={errors.capacidad} placeholder="500" />
              </div>
              <div>
                <FormField id="ev-imagen" label="Imagen de portada" type="file" accept="image/jpeg,image/png,image/webp"
                  onChange={e => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) setForm(p => ({ ...p, imagen_portada: file, imagen_preview: URL.createObjectURL(file) }));
                  }} />
                {form.imagen_preview && (
                  <img src={form.imagen_preview} alt={form.imagen_alt || 'Vista previa'} style={{ maxHeight: '180px', borderRadius: '0.5rem', marginTop: '0.5rem', border: '2px solid var(--color-border)' }} />
                )}
                {form.imagen_portada && (
                  <FormField id="ev-alt" label="Texto alternativo (alt) de la imagen" type="text" required
                    value={form.imagen_alt} onChange={updateField('imagen_alt')} error={errors.imagen_alt}
                    placeholder="Describe la imagen para lectores de pantalla" helpText="Obligatorio para accesibilidad (WCAG 1.1.1)" />
                )}
              </div>
            </FormFieldset>
          )}

          {/* ── PASO 2: Ubicación y Fecha ─── */}
          {currentStep === 1 && (
            <FormFieldset legend="Ubicación y Fecha">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <FormField id="ev-inicio" label="Fecha y hora de inicio" type="datetime-local" required
                  value={form.inicio} onChange={updateField('inicio')} error={errors.inicio} />
                <FormField id="ev-fin" label="Fecha y hora de fin" type="datetime-local" required
                  value={form.fin} onChange={updateField('fin')} error={errors.fin} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <FormField id="ev-inicio-reg" label="Inicio de registro (opcional)" type="datetime-local"
                  value={form.inicio_registro} onChange={updateField('inicio_registro')} />
                <FormField id="ev-fin-reg" label="Fin de registro (opcional)" type="datetime-local"
                  value={form.fin_registro} onChange={updateField('fin_registro')} />
              </div>
              <FormField id="ev-lugar" label="Lugar" as="select" value={form.lugar_id} onChange={updateField('lugar_id')}>
                <option value="">Sin lugar específico (virtual/por definir)</option>
                {lugares.map(l => (
                  <option key={l.id} value={l.id}>{l.nombre} — {l.ciudad} (cap. {l.capacidad})</option>
                ))}
              </FormField>

              {/* Tipos de Entrada en paso 2 */}
              <fieldset>
                <legend style={{ fontWeight: 600, color: 'var(--color-primary)', marginBottom: '1rem' }}>Tipos de Entrada</legend>
                <table className="dynamic-table" role="table" aria-label="Tipos de entrada">
                  <thead>
                    <tr>
                      <th scope="col">Nombre</th>
                      <th scope="col">Precio ($)</th>
                      <th scope="col">Cupos</th>
                      <th scope="col"><span className="sr-only">Acciones</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tiposEntrada.map((te, i) => (
                      <tr key={i}>
                        <td>
                          <input type="text" aria-label={`Nombre tipo entrada ${i + 1}`} value={te.nombre}
                            onChange={e => setTiposEntrada(p => p.map((x, j) => j === i ? { ...x, nombre: e.target.value } : x))}
                            placeholder="General, VIP..." id={`te-nombre-${i}`} />
                        </td>
                        <td>
                          <input type="number" min={0} step={0.01} aria-label={`Precio tipo entrada ${i + 1}`} value={te.precio}
                            onChange={e => setTiposEntrada(p => p.map((x, j) => j === i ? { ...x, precio: e.target.value } : x))}
                            id={`te-precio-${i}`} />
                        </td>
                        <td>
                          <input type="number" min={1} aria-label={`Cupos tipo entrada ${i + 1}`} value={te.cupos}
                            onChange={e => setTiposEntrada(p => p.map((x, j) => j === i ? { ...x, cupos: e.target.value } : x))}
                            id={`te-cupos-${i}`} />
                        </td>
                        <td>
                          {tiposEntrada.length > 1 && (
                            <AccessibleTooltip content="Eliminar tipo de entrada">
                              <button type="button" className="btn btn-danger btn-sm"
                                onClick={() => setTiposEntrada(p => p.filter((_, j) => j !== i))}
                                aria-label={`Eliminar tipo de entrada ${te.nombre || i + 1}`}>✕</button>
                            </AccessibleTooltip>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button type="button" className="btn btn-secondary btn-sm"
                  onClick={() => setTiposEntrada(p => [...p, { nombre: '', precio: '0', cupos: '50' }])}>
                  ＋ Agregar tipo de entrada
                </button>
              </fieldset>
            </FormFieldset>
          )}

          {/* ── PASO 3: Agenda ─── */}
          {currentStep === 2 && (
            <FormFieldset legend="Agenda del Evento">
              {sesiones.length === 0 && (
                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
                  No hay sesiones. Agrega sesiones para definir la agenda del evento.
                </p>
              )}
              <table className="dynamic-table" role="table" aria-label="Sesiones del evento">
                {sesiones.length > 0 && (
                  <thead>
                    <tr>
                      <th scope="col">Sesión / Ponente</th>
                      <th scope="col">Inicio</th>
                      <th scope="col">Fin</th>
                      <th scope="col"><span className="sr-only">Eliminar</span></th>
                    </tr>
                  </thead>
                )}
                <tbody>
                  {sesiones.map((s, i) => (
                    <tr key={i}>
                      <td>
                        <input type="text" aria-label={`Título sesión ${i + 1}`} value={s.titulo} placeholder="Título de la sesión"
                          onChange={e => setSesiones(p => p.map((x, j) => j === i ? { ...x, titulo: e.target.value } : x))}
                          id={`ses-titulo-${i}`} style={{ marginBottom: '0.5rem' }} />
                        <input type="text" aria-label={`Ponente sesión ${i + 1}`} value={s.ponente} placeholder="Ponente / Presentador"
                          onChange={e => setSesiones(p => p.map((x, j) => j === i ? { ...x, ponente: e.target.value } : x))}
                          id={`ses-ponente-${i}`} />
                      </td>
                      <td>
                        <input type="datetime-local" aria-label={`Hora inicio sesión ${i + 1}`} value={s.inicio}
                          onChange={e => setSesiones(p => p.map((x, j) => j === i ? { ...x, inicio: e.target.value } : x))}
                          id={`ses-inicio-${i}`} />
                      </td>
                      <td>
                        <input type="datetime-local" aria-label={`Hora fin sesión ${i + 1}`} value={s.fin}
                          onChange={e => setSesiones(p => p.map((x, j) => j === i ? { ...x, fin: e.target.value } : x))}
                          id={`ses-fin-${i}`} />
                      </td>
                      <td>
                        <AccessibleTooltip content="Eliminar sesión">
                          <button type="button" className="btn btn-danger btn-sm"
                            onClick={() => setSesiones(p => p.filter((_, j) => j !== i))}
                            aria-label={`Eliminar sesión ${s.titulo || i + 1}`}>✕</button>
                        </AccessibleTooltip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSesiones(p => [...p, { titulo: '', inicio: '', fin: '', ponente: '' }])}>
                ＋ Agregar sesión
              </button>
            </FormFieldset>
          )}

          {/* ── PASO 4: Inventario de Recursos ─── */}
          {currentStep === 3 && (
            <FormFieldset legend="Inventario de Recursos">
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                Registra el material y equipo necesario para el evento.
              </p>
              {materiales.length === 0 && (
                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '1.5rem' }}>
                  Sin materiales registrados. Agrega los recursos necesarios.
                </p>
              )}
              <table className="dynamic-table" role="table" aria-label="Inventario de recursos">
                {materiales.length > 0 && (
                  <thead>
                    <tr>
                      <th scope="col">Material</th>
                      <th scope="col">Cantidad</th>
                      <th scope="col">Estado</th>
                      <th scope="col">Notas</th>
                      <th scope="col"><span className="sr-only">Eliminar</span></th>
                    </tr>
                  </thead>
                )}
                <tbody>
                  {materiales.map((m, i) => (
                    <tr key={i}>
                      <td>
                        <input type="text" aria-label={`Nombre material ${i + 1}`} value={m.nombre} placeholder="Ej: Proyector 4K"
                          onChange={e => setMateriales(p => p.map((x, j) => j === i ? { ...x, nombre: e.target.value } : x))}
                          id={`mat-nombre-${i}`} />
                      </td>
                      <td>
                        <input type="number" min={1} aria-label={`Cantidad material ${i + 1}`} value={m.cantidad}
                          onChange={e => setMateriales(p => p.map((x, j) => j === i ? { ...x, cantidad: e.target.value } : x))}
                          id={`mat-cant-${i}`} style={{ maxWidth: '80px' }} />
                      </td>
                      <td>
                        <select aria-label={`Estado material ${i + 1}`} value={m.estado}
                          onChange={e => setMateriales(p => p.map((x, j) => j === i ? { ...x, estado: e.target.value } : x))}
                          id={`mat-estado-${i}`}>
                          <option value="pendiente">Pendiente</option>
                          <option value="asignado">Asignado</option>
                          <option value="entregado">Entregado</option>
                        </select>
                      </td>
                      <td>
                        <input type="text" aria-label={`Notas material ${i + 1}`} value={m.notas} placeholder="Notas opcionales"
                          onChange={e => setMateriales(p => p.map((x, j) => j === i ? { ...x, notas: e.target.value } : x))}
                          id={`mat-notas-${i}`} />
                      </td>
                      <td>
                        <AccessibleTooltip content="Eliminar material">
                          <button type="button" className="btn btn-danger btn-sm"
                            onClick={() => setMateriales(p => p.filter((_, j) => j !== i))}
                            aria-label={`Eliminar material ${m.nombre || i + 1}`}>✕</button>
                        </AccessibleTooltip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setMateriales(p => [...p, { nombre: '', cantidad: '1', estado: 'pendiente', notas: '' }])}>
                ＋ Agregar material
              </button>
            </FormFieldset>
          )}

          {/* ── Acciones de navegación ─── */}
          <div className="stepper-actions">
            <button type="button" className="btn btn-ghost" onClick={handlePrev} disabled={currentStep === 0} id="step-prev">
              ← Anterior
            </button>
            <div className="stepper-save-indicator" aria-live="polite" aria-atomic="true">
              {saving && <><span className="btn-spinner" aria-hidden="true" /> Guardando...</>}
            </div>
            {currentStep < STEPS.length - 1 ? (
              <button type="button" className="btn btn-primary" onClick={handleNext} disabled={saving} id="step-next">
                Siguiente →
              </button>
            ) : (
              <button type="submit" className="btn btn-primary btn-lg" disabled={saving} id="btn-finish">
                {saving ? <><span className="btn-spinner" aria-hidden="true" /> Guardando...</> : '🚀 Finalizar y guardar'}
              </button>
            )}
          </div>
        </div>
      </form>
      {showHelp && (
        <HelpVideoModal
          videoSrc="/videos/CrearEvento.mp4"
          videoVtt="/videos/CrearEvento.vtt"
          title="Crear un Evento"
          description="Un video donde se muestra cómo crear un evento para que el usuario organizador sepa cómo hacerlo."
          transcription={
            <>
              <p><strong className="text-foreground">0:00</strong> Aquí en crear evento podemos configurar el tipo de evento, la frecuencia, el título, la descripción, el costo, el aforo máximo y una imagen destacada.</p>
              <p><strong className="text-foreground">0:18</strong> En la ubicación y fecha, asignamos la fecha y el lugar donde se realizará el evento.</p>
              <p><strong className="text-foreground">0:36</strong> Configuramos los lugares disponibles, el tipo de entrada, la cantidad de entradas, los ponentes y la fecha de finalización.</p>
              <p><strong className="text-foreground">1:02</strong> Y así se crea un nuevo evento.</p>
            </>
          }
          onClose={() => setShowHelp(false)}
        />
      )}
    </div>
  );
}
