import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import AlertMessage from '../../components/ui/AlertMessage';
import './attendee.css';

/* ── Types ─────────────────────────────────────────────────────────────── */

interface Evento {
  id: string;
  titulo: string;
  descripcion?: string;
  inicio: string;
  fin: string;
  capacidad: number;
  costo: number;
  estado: string;
  imagen_portada?: string;
  tipo_evento_nombre?: string;
  lugar_id?: string;
  lugar_nombre?: string;
  lugar_direccion?: string;
  lugar_ciudad?: string;
  accesibilidad_fisica: boolean;
  accesibilidad_sensorial: boolean;
}

interface Sesion {
  id: string;
  titulo: string;
  descripcion?: string;
  inicio: string;
  fin: string;
  ponente?: string;
  sala?: string;
  orden: number;
}

interface Disponibilidad {
  capacidad_total: number;
  inscritos: number;
  cupos_disponibles: number;
  tipos_entrada: Array<{
    id: string;
    nombre: string;
    precio: number;
    disponible: boolean;
    cupos_total: number;
    cupos_usados: number;
  }>;
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('es-EC', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-EC', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function durationMinutes(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
}

/* ── Main Component ─────────────────────────────────────────────────────── */

export default function EventDetailPage() {
  const { eventoId } = useParams<{ eventoId: string }>();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [disponibilidad, setDisponibilidad] = useState<Disponibilidad | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventoId) return;
    const load = async () => {
      try {
        const [evRes, sesRes, dispRes] = await Promise.allSettled([
          apiRequest<Evento>(`/eventos/${eventoId}`),
          apiRequest<Sesion[]>(`/eventos/${eventoId}/sesiones`),
          apiRequest<Disponibilidad>(`/eventos/${eventoId}/disponibilidad`),
        ]);

        if (evRes.status === 'fulfilled') setEvento(evRes.value.data ?? null);
        else setError('Evento no encontrado');

        if (sesRes.status === 'fulfilled') {
          const ses = sesRes.value.data ?? [];
          setSesiones([...ses].sort((a, b) => a.orden - b.orden));
        }

        if (dispRes.status === 'fulfilled') setDisponibilidad(dispRes.value.data ?? null);
      } catch {
        setError('Error al cargar el evento');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [eventoId]);

  // Poll availability every 30s
  useEffect(() => {
    if (!eventoId) return;
    const iv = setInterval(async () => {
      try {
        const r = await apiRequest<Disponibilidad>(`/eventos/${eventoId}/disponibilidad`);
        if (r.data) setDisponibilidad(r.data);
      } catch { /* silent */ }
    }, 30000);
    return () => clearInterval(iv);
  }, [eventoId]);

  const handleInscribirse = () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/eventos/${eventoId}/inscripcion`);
    } else {
      navigate(`/eventos/${eventoId}/inscripcion`);
    }
  };

  if (loading) return <LoadingSpinner message="Cargando evento..." />;

  if (error || !evento) {
    return (
      <main id="main-content" className="container" style={{ paddingBlock: 'var(--space-8)' }}>
        <AlertMessage type="error" message={error ?? 'Evento no encontrado'} />
        <button className="btn btn-ghost" onClick={() => navigate('/eventos')} style={{ marginTop: 'var(--space-4)' }}>
          ← Volver al catálogo
        </button>
      </main>
    );
  }

  const cuposDisponibles = disponibilidad?.cupos_disponibles ?? evento.capacidad;
  const agotado = cuposDisponibles === 0;
  const pocosLugares = !agotado && cuposDisponibles <= 5;

  const mapsQuery = encodeURIComponent(
    [evento.lugar_nombre, evento.lugar_direccion, evento.lugar_ciudad]
      .filter(Boolean).join(', ')
  );
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  return (
    <>
      {/* Skip link is handled in AppContent */}

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <header className="detail-hero" role="banner">
        {evento.imagen_portada && (
          <img
            src={evento.imagen_portada}
            alt=""
            className="detail-hero__image"
            aria-hidden="true"
          />
        )}
        <div className="detail-hero__overlay" aria-hidden="true" />
        <div className="detail-hero__content container">
          <div className="detail-hero__badges">
            {evento.tipo_evento_nombre && (
              <span className="badge badge--category">{evento.tipo_evento_nombre}</span>
            )}
            {evento.accesibilidad_fisica && (
              <span className="badge badge--accessible-physical" aria-label="Accesibilidad física disponible">
                ♿ Accesible físicamente
              </span>
            )}
            {evento.accesibilidad_sensorial && (
              <span className="badge badge--accessible-sensory" aria-label="Accesibilidad sensorial disponible">
                👂 Accesible sensorialmente
              </span>
            )}
          </div>

          <h1 className="detail-hero__title">{evento.titulo}</h1>

          <div className="detail-hero__meta">
            <div className="detail-hero__meta-item">
              <span aria-hidden="true">📅</span>
              <span>{formatDateTime(evento.inicio)}</span>
            </div>
            {evento.lugar_nombre && (
              <div className="detail-hero__meta-item">
                <span aria-hidden="true">📍</span>
                <span>{evento.lugar_nombre}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      <main id="main-content" className="detail-page">
        <div className="container">
          <div className="detail-body">

            {/* Left column */}
            <div className="detail-main">

              {/* Description */}
              {evento.descripcion && (
                <section className="detail-section" aria-labelledby="desc-title">
                  <h2 id="desc-title" className="detail-section__title">
                    <span aria-hidden="true">📄</span> Sobre el evento
                  </h2>
                  <p className="detail-section__desc">{evento.descripcion}</p>
                </section>
              )}

              {/* Agenda */}
              {sesiones.length > 0 && (
                <section className="detail-section" aria-labelledby="agenda-title">
                  <h2 id="agenda-title" className="detail-section__title">
                    <span aria-hidden="true">🗓️</span> Agenda
                  </h2>
                  <ol className="agenda-list" aria-label="Agenda del evento ordenada por horarios">
                    {sesiones.map((s, idx) => {
                      const dur = durationMinutes(s.inicio, s.fin);
                      return (
                        <li key={s.id} className="agenda-item">
                          <div className="agenda-item__time" aria-label={`Horario: ${formatTime(s.inicio)} a ${formatTime(s.fin)}`}>
                            <span className="agenda-item__hour">{formatTime(s.inicio)}</span>
                            <span className="agenda-item__duration">
                              {dur < 60 ? `${dur} min` : `${Math.floor(dur/60)}h ${dur % 60 > 0 ? `${dur % 60}min` : ''}`}
                            </span>
                          </div>
                          <div className="agenda-item__content">
                            <h3 className="agenda-item__title">
                              {idx + 1}. {s.titulo}
                            </h3>
                            {s.ponente && (
                              <p className="agenda-item__speaker">
                                <span aria-hidden="true">🎤</span>
                                <span>{s.ponente}</span>
                              </p>
                            )}
                            {s.sala && (
                              <span className="agenda-item__sala" aria-label={`Sala: ${s.sala}`}>
                                <span aria-hidden="true">🚪</span> {s.sala}
                              </span>
                            )}
                            {s.descripcion && (
                              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
                                {s.descripcion}
                              </p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              )}

              {/* Location */}
              {evento.lugar_nombre && (
                <section className="detail-section" aria-labelledby="location-title">
                  <h2 id="location-title" className="detail-section__title">
                    <span aria-hidden="true">📍</span> Ubicación
                  </h2>
                  <div className="location-card">
                    <div className="location-card__icon" aria-hidden="true">🏛️</div>
                    <div className="location-card__info">
                      <p className="location-card__name">{evento.lugar_nombre}</p>
                      {evento.lugar_direccion && (
                        <p className="location-card__address">
                          {evento.lugar_direccion}
                          {evento.lugar_ciudad ? `, ${evento.lugar_ciudad}` : ''}
                        </p>
                      )}
                      {(evento.accesibilidad_fisica || evento.accesibilidad_sensorial) && (
                        <div className="location-card__accessibility">
                          {evento.accesibilidad_fisica && (
                            <span className="badge badge--accessible-physical" aria-label="Lugar con accesibilidad física">
                              ♿ Accesible físicamente
                            </span>
                          )}
                          {evento.accesibilidad_sensorial && (
                            <span className="badge badge--accessible-sensory" aria-label="Lugar con accesibilidad sensorial">
                              👂 Accesible sensorialmente
                            </span>
                          )}
                        </div>
                      )}
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="location-card__map-link"
                        aria-label={`Ver ${evento.lugar_nombre} en Google Maps (abre en nueva pestaña)`}
                      >
                        <span aria-hidden="true">🗺️</span>
                        Ver en Google Maps
                        <span className="sr-only">(abre en nueva pestaña)</span>
                      </a>
                    </div>
                  </div>
                </section>
              )}
            </div>

            {/* Right sidebar — desktop */}
            <aside className="detail-sidebar" aria-label="Información de inscripción">
              <div className="detail-price-card">
                <p className="detail-price-card__label">Costo de inscripción</p>
                <p className={`detail-price-card__price ${evento.costo === 0 ? 'detail-price-card__price--free' : ''}`}>
                  {evento.costo === 0 ? 'Gratis' : `$${evento.costo.toFixed(2)}`}
                </p>

                {disponibilidad && (
                  <p className={`detail-price-card__slots ${agotado || pocosLugares ? 'detail-price-card__slots--critical' : ''}`}
                     aria-live="polite">
                    {agotado
                      ? '⊘ Sin cupos disponibles'
                      : pocosLugares
                        ? `⚠️ ¡Solo ${cuposDisponibles} cupo${cuposDisponibles !== 1 ? 's' : ''}!`
                        : `✅ ${cuposDisponibles} cupos disponibles`
                    }
                  </p>
                )}

                <button
                  type="button"
                  className="btn btn-primary btn-block btn-lg"
                  onClick={handleInscribirse}
                  disabled={agotado}
                  id="btn-inscribirse-desktop"
                  aria-disabled={agotado}
                >
                  {agotado ? '⊘ Evento lleno' : '🎟️ Inscribirme'}
                </button>

                {!isAuthenticated && !agotado && (
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)', textAlign: 'center' }}>
                    Se requiere iniciar sesión para inscribirse
                  </p>
                )}
              </div>

              {/* Dates card */}
              <div className="card" style={{ padding: 'var(--space-5)' }}>
                <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, marginBottom: 'var(--space-3)' }}>
                  📅 Fechas
                </h3>
                <dl style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <div>
                    <dt style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Inicio</dt>
                    <dd style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{formatDateTime(evento.inicio)}</dd>
                  </div>
                  <div>
                    <dt style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Fin</dt>
                    <dd style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{formatDateTime(evento.fin)}</dd>
                  </div>
                </dl>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* ── Floating CTA — Mobile ────────────────────────────────────── */}
      <div
        className="floating-cta"
        role="complementary"
        aria-label="Inscripción rápida"
      >
        <div className="floating-cta__info">
          <p className="floating-cta__title">{evento.titulo}</p>
          <p className="floating-cta__price">
            {evento.costo === 0 ? 'Gratis' : `$${evento.costo.toFixed(2)}`}
            {disponibilidad && !agotado && ` · ${cuposDisponibles} cupos`}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary floating-cta__btn"
          onClick={handleInscribirse}
          disabled={agotado}
          id="btn-inscribirse-mobile"
          aria-label={agotado ? 'Evento sin cupos disponibles' : `Inscribirme al evento ${evento.titulo}`}
        >
          {agotado ? '⊘ Lleno' : '🎟️ Inscribirme'}
        </button>
      </div>
    </>
  );
}
