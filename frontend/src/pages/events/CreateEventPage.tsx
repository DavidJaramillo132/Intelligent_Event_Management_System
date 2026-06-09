import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import FormField from '../../components/ui/FormField';
import FormFieldset from '../../components/ui/FormFieldset';
import AlertMessage from '../../components/ui/AlertMessage';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { validateRequired, validateNumber } from '../../utils/validators';
import './events.css';

interface TipoEvento { id: number; nombre: string; }
interface Lugar { id: string; nombre: string; direccion: string; ciudad: string; capacidad: number; }
interface Sesion { titulo: string; inicio: string; fin: string; ponente: string; }
interface TipoEntradaForm { nombre: string; precio: string; cupos: string; }

export default function CreateEventPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tiposEvento, setTiposEvento] = useState<TipoEvento[]>([]);
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [form, setForm] = useState({
    tipo_evento_id: '',
    titulo: '',
    descripcion: '',
    inicio: '',
    fin: '',
    lugar_id: '',
    capacidad: '',
    imagen_portada: null as File | null,
    imagen_alt: '',
    imagen_preview: '',
  });

  const [tiposEntrada, setTiposEntrada] = useState<TipoEntradaForm[]>([
    { nombre: 'General', precio: '0', cupos: '100' },
  ]);

  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const [tiposRes, lugaresRes] = await Promise.all([
          api.get<TipoEvento[]>('/tipos-evento'),
          api.get<Lugar[]>('/lugares'),
        ]);
        setTiposEvento(tiposRes.data || []);
        setLugares(lugaresRes.data || []);
      } catch {
        // Data will be empty, user can still fill the form
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, []);

  const updateField = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(p => ({ ...p, [field]: e.target.value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm(p => ({
        ...p,
        imagen_portada: file,
        imagen_preview: URL.createObjectURL(file),
      }));
    }
  };

  const addTipoEntrada = () => {
    setTiposEntrada(p => [...p, { nombre: '', precio: '0', cupos: '50' }]);
  };

  const removeTipoEntrada = (i: number) => {
    setTiposEntrada(p => p.filter((_, idx) => idx !== i));
  };

  const updateTipoEntrada = (i: number, field: string, value: string) => {
    setTiposEntrada(p => p.map((te, idx) => idx === i ? { ...te, [field]: value } : te));
  };

  const addSesion = () => {
    setSesiones(p => [...p, { titulo: '', inicio: '', fin: '', ponente: '' }]);
  };

  const removeSesion = (i: number) => {
    setSesiones(p => p.filter((_, idx) => idx !== i));
  };

  const updateSesion = (i: number, field: string, value: string) => {
    setSesiones(p => p.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    const titleErr = validateRequired(form.titulo, 'Nombre del evento');
    if (titleErr) e.titulo = titleErr;
    if (!form.inicio) e.inicio = 'La fecha de inicio es requerida';
    if (!form.fin) e.fin = 'La fecha de fin es requerida';
    if (form.inicio && form.fin && new Date(form.fin) <= new Date(form.inicio)) {
      e.fin = 'La fecha de fin debe ser posterior a la de inicio';
    }
    const capErr = validateNumber(form.capacidad, 'Capacidad', 1);
    if (capErr) e.capacidad = capErr;
    if (form.imagen_portada && !form.imagen_alt.trim()) {
      e.imagen_alt = 'Proporcione una descripción alternativa para la imagen (requerido para accesibilidad)';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setSubmitError(null);
    if (!validate()) return;
    setSubmitting(true);

    try {
      // 1. Upload image if present
      let imagenUrl = '';
      if (form.imagen_portada) {
        const formData = new FormData();
        formData.append('archivo', form.imagen_portada);
        const uploadRes = await api.upload<{ url: string }>('/uploads', formData);
        imagenUrl = uploadRes.data?.url || '';
      }

      // 2. Create event
      const eventoRes = await api.post<{ id: string }>('/eventos', {
        organizador_id: user?.id,
        tipo_evento_id: form.tipo_evento_id ? Number(form.tipo_evento_id) : 1,
        lugar_id: form.lugar_id || undefined,
        titulo: form.titulo,
        descripcion: form.descripcion,
        inicio: new Date(form.inicio).toISOString(),
        fin: new Date(form.fin).toISOString(),
        capacidad: Number(form.capacidad),
        costo: tiposEntrada.length > 0 ? Number(tiposEntrada[0].precio) : 0,
        imagen_portada: imagenUrl,
      });

      const eventoId = eventoRes.data?.id;

      // 3. Create ticket types
      if (eventoId) {
        for (const te of tiposEntrada) {
          if (te.nombre.trim()) {
            await api.post(`/eventos/${eventoId}/tipos-entrada`, {
              nombre: te.nombre,
              precio: Number(te.precio),
              cupos_total: Number(te.cupos),
            });
          }
        }

        // 4. Create sessions
        for (let i = 0; i < sesiones.length; i++) {
          const s = sesiones[i];
          if (s.titulo.trim()) {
            await api.post(`/eventos/${eventoId}/sesiones`, {
              titulo: s.titulo,
              inicio: s.inicio ? new Date(s.inicio).toISOString() : new Date(form.inicio).toISOString(),
              fin: s.fin ? new Date(s.fin).toISOString() : new Date(form.fin).toISOString(),
              ponente: s.ponente,
              orden: i,
            });
          }
        }
      }

      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error al crear el evento');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) return <LoadingSpinner message="Cargando datos..." />;

  return (
    <main className="events-page" id="main-content">
      <div className="container">
        <div className="events-page__header animate-fade-in">
          <h1>Crear Nuevo Evento</h1>
          <p>Define los parámetros de tu evento paso a paso</p>
        </div>

        {submitError && <AlertMessage type="error" message={submitError} onClose={() => setSubmitError(null)} />}
        {success && <AlertMessage type="success" message="✅ ¡Evento creado exitosamente!" />}

        <form onSubmit={handleSubmit} noValidate className="events-form card animate-slide-up">

          {/* ── DATOS BÁSICOS ─────────────────────────────────────────── */}
          <FormFieldset legend="Datos Básicos del Evento">
            <FormField
              id="event-type"
              label="Tipo de evento"
              as="select"
              required
              value={form.tipo_evento_id}
              onChange={updateField('tipo_evento_id')}
            >
              <option value="">Seleccione un tipo</option>
              {tiposEvento.map(t => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </FormField>

            <FormField
              id="event-title"
              label="Nombre del evento"
              type="text"
              required
              value={form.titulo}
              onChange={updateField('titulo')}
              error={errors.titulo}
              placeholder="Conferencia de Tecnología 2026"
            />

            <FormField
              id="event-description"
              label="Descripción detallada"
              as="textarea"
              value={form.descripcion}
              onChange={updateField('descripcion')}
              placeholder="Describe de qué trata tu evento, qué podrán esperar los asistentes..."
              helpText="El usuario puede ajustar el espaciado de líneas según sus preferencias"
            />

            {/* Image upload with alt text (WCAG 1.1.1) */}
            <div className="events-form__image-upload">
              <FormField
                id="event-image"
                label="Imagen de portada"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
              />

              {form.imagen_preview && (
                <div className="events-form__preview">
                  <img
                    src={form.imagen_preview}
                    alt={form.imagen_alt || 'Vista previa de imagen de portada'}
                    className="events-form__preview-img"
                  />
                </div>
              )}

              {form.imagen_portada && (
                <FormField
                  id="event-image-alt"
                  label="Texto alternativo de la imagen"
                  type="text"
                  required
                  value={form.imagen_alt}
                  onChange={updateField('imagen_alt')}
                  error={errors.imagen_alt}
                  placeholder="Describe la imagen para personas que usan lectores de pantalla"
                  helpText="Obligatorio para accesibilidad (WCAG 1.1.1)"
                />
              )}
            </div>
          </FormFieldset>

          {/* ── FECHA Y LUGAR ─────────────────────────────────────────── */}
          <FormFieldset legend="Fecha y Lugar">
            <div className="events-form__row">
              <FormField
                id="event-start"
                label="Fecha y hora de inicio"
                type="datetime-local"
                required
                value={form.inicio}
                onChange={updateField('inicio')}
                error={errors.inicio}
              />
              <FormField
                id="event-end"
                label="Fecha y hora de fin"
                type="datetime-local"
                required
                value={form.fin}
                onChange={updateField('fin')}
                error={errors.fin}
              />
            </div>

            <div className="events-form__row">
              <FormField
                id="event-venue"
                label="Lugar"
                as="select"
                value={form.lugar_id}
                onChange={updateField('lugar_id')}
              >
                <option value="">Seleccione un lugar (opcional)</option>
                {lugares.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.nombre} — {l.ciudad} (cap. {l.capacidad})
                  </option>
                ))}
              </FormField>
              <FormField
                id="event-capacity"
                label="Capacidad máxima"
                type="number"
                required
                min={1}
                value={form.capacidad}
                onChange={updateField('capacidad')}
                error={errors.capacidad}
                placeholder="500"
              />
            </div>
          </FormFieldset>

          {/* ── COSTOS Y ENTRADAS ─────────────────────────────────────── */}
          <FormFieldset legend="Costos y Tipos de Entrada">
            {tiposEntrada.map((te, i) => (
              <div key={i} className="events-form__entry-row">
                <FormField
                  id={`entry-name-${i}`}
                  label={`Tipo de entrada ${i + 1} — Nombre`}
                  type="text"
                  required
                  value={te.nombre}
                  onChange={e => updateTipoEntrada(i, 'nombre', e.target.value)}
                  placeholder="General, VIP, Estudiante..."
                />
                <FormField
                  id={`entry-price-${i}`}
                  label="Precio ($)"
                  type="number"
                  min={0}
                  step={0.01}
                  value={te.precio}
                  onChange={e => updateTipoEntrada(i, 'precio', e.target.value)}
                  placeholder="0.00"
                />
                <FormField
                  id={`entry-slots-${i}`}
                  label="Cupos"
                  type="number"
                  min={1}
                  value={te.cupos}
                  onChange={e => updateTipoEntrada(i, 'cupos', e.target.value)}
                  placeholder="100"
                />
                {tiposEntrada.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm events-form__remove-btn"
                    onClick={() => removeTipoEntrada(i)}
                    aria-label={`Eliminar tipo de entrada ${te.nombre || i + 1}`}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="btn btn-secondary btn-sm" onClick={addTipoEntrada}>
              + Agregar tipo de entrada
            </button>
          </FormFieldset>

          {/* ── AGENDA / SESIONES ─────────────────────────────────────── */}
          <FormFieldset legend="Agenda / Sesiones">
            {sesiones.length === 0 && (
              <p className="events-form__empty-hint">
                No hay sesiones configuradas. Agregue sesiones para definir la agenda del evento.
              </p>
            )}
            {sesiones.map((s, i) => (
              <div key={i} className="events-form__session-row">
                <FormField
                  id={`session-title-${i}`}
                  label={`Sesión ${i + 1} — Título`}
                  type="text"
                  value={s.titulo}
                  onChange={e => updateSesion(i, 'titulo', e.target.value)}
                  placeholder="Charla inaugural"
                />
                <div className="events-form__row">
                  <FormField
                    id={`session-start-${i}`}
                    label="Hora inicio"
                    type="datetime-local"
                    value={s.inicio}
                    onChange={e => updateSesion(i, 'inicio', e.target.value)}
                  />
                  <FormField
                    id={`session-end-${i}`}
                    label="Hora fin"
                    type="datetime-local"
                    value={s.fin}
                    onChange={e => updateSesion(i, 'fin', e.target.value)}
                  />
                </div>
                <FormField
                  id={`session-speaker-${i}`}
                  label="Ponente"
                  type="text"
                  value={s.ponente}
                  onChange={e => updateSesion(i, 'ponente', e.target.value)}
                  placeholder="Dr. María García"
                />
                <button
                  type="button"
                  className="btn btn-danger btn-sm events-form__remove-btn"
                  onClick={() => removeSesion(i)}
                  aria-label={`Eliminar sesión ${s.titulo || i + 1}`}
                >
                  ✕ Eliminar sesión
                </button>
              </div>
            ))}
            <button type="button" className="btn btn-secondary btn-sm" onClick={addSesion}>
              + Agregar sesión
            </button>
          </FormFieldset>

          {/* ── SUBMIT ────────────────────────────────────────────────── */}
          <div className="events-form__actions">
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={submitting}
              id="btn-create-event"
            >
              {submitting ? (
                <>
                  <span className="btn-spinner" aria-hidden="true" />
                  Creando evento...
                </>
              ) : (
                '🚀 Crear Evento'
              )}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-lg"
              onClick={() => navigate('/')}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
