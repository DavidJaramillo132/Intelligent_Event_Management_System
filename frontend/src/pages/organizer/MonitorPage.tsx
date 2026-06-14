import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { organizerApi, type EventoStats, type Incidencia } from '../../api/organizerApi';
import AlertMessage from '../../components/ui/AlertMessage';
import './organizer.css';

type Criticidad = 'informativa' | 'advertencia' | 'critica';

const CRITICIDAD_LABELS: Record<Criticidad, string> = {
  informativa: '💬 Informativa',
  advertencia: '⚠️ Advertencia',
  critica: '🚨 Crítica',
};

export default function MonitorPage() {
  const { eventoId } = useParams<{ eventoId: string }>();
  const [stats, setStats] = useState<EventoStats | null>(null);
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [criticidad, setCriticidad] = useState<Criticidad>('informativa');
  const [descripcion, setDescripcion] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('—');
  const statsInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = () => {
    if (!eventoId) return;
    organizerApi.stats(eventoId).then(r => {
      setStats(r.data ?? null);
      setLastUpdate(new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }).catch(() => null);
    organizerApi.listarIncidencias(eventoId).then(r => setIncidencias(r.data ?? [])).catch(() => null);
  };

  useEffect(() => {
    loadData();
    statsInterval.current = setInterval(loadData, 10000);
    return () => { if (statsInterval.current) clearInterval(statsInterval.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventoId]);

  const handleSubmitIncidencia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion.trim() || !eventoId) return;
    setSending(true);
    setError(null);
    try {
      const res = await organizerApi.crearIncidencia({ evento_id: eventoId, criticidad, descripcion });
      const nueva = res.data;
      if (nueva) setIncidencias(prev => [nueva, ...prev]);
      setDescripcion('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar incidencia');
    } finally {
      setSending(false);
    }
  };

  const pct = stats?.pct_ocupacion ?? 0;
  const barClass = pct >= 90 ? 'high' : pct >= 70 ? 'mid' : 'low';

  return (
    <main className="monitor-page" id="main-content">
      <div className="container">
        {/* Header */}
        <div className="monitor-header">
          <Link to="/organizador" className="org-back-btn" id="monitor-back">
            ← Volver al Hub
          </Link>
          <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, flex: 1 }}>
            📊 Monitor en Tiempo Real
          </h1>
          <div className="monitor-pulse" aria-label="Actualización automática cada 10 segundos" title={`Última actualización: ${lastUpdate}`}>
            <div className="monitor-pulse__dot" aria-hidden="true" />
            <span>EN VIVO · {lastUpdate}</span>
          </div>
        </div>

        {/* KPI Cards */}
        <section aria-label="Métricas del evento">
          <div className="monitor-kpis" role="list">
            <article className="kpi-card" role="listitem" aria-label={`Asistentes ingresados: ${stats?.checkins ?? '...'}`}>
              <div className="kpi-card__icon" aria-hidden="true">🎫</div>
              <div className="kpi-card__value" aria-live="polite">{stats?.checkins ?? '—'}</div>
              <div className="kpi-card__label">Asistentes ingresados</div>
            </article>
            <article className="kpi-card" role="listitem" aria-label={`Inscripciones: ${stats?.inscripciones ?? '...'}`}>
              <div className="kpi-card__icon" aria-hidden="true">📝</div>
              <div className="kpi-card__value" aria-live="polite">{stats?.inscripciones ?? '—'}</div>
              <div className="kpi-card__label">Inscripciones totales</div>
            </article>
            <article className="kpi-card" role="listitem" aria-label={`Capacidad: ${stats?.capacidad ?? '...'}`}>
              <div className="kpi-card__icon" aria-hidden="true">🏟️</div>
              <div className="kpi-card__value">{stats?.capacidad ?? '—'}</div>
              <div className="kpi-card__label">Capacidad total</div>
            </article>
            <article className="kpi-card" role="listitem" aria-label={`Ocupación: ${pct}%`}>
              <div className="kpi-card__icon" aria-hidden="true">📈</div>
              <div className="kpi-card__value" aria-live="polite" style={{ color: pct >= 90 ? 'var(--color-error)' : pct >= 70 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                {pct}%
              </div>
              <div className="kpi-card__label">% de ocupación</div>
              <div className="occupancy-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Ocupación: ${pct}%`}>
                <div className={`occupancy-bar__fill occupancy-bar__fill--${barClass}`} style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
            </article>
          </div>
        </section>

        {/* Grid principal */}
        <div className="monitor-grid">
          {/* Formulario de incidencias */}
          <div>
            <div className="incidencia-form">
              <h2 className="incidencia-form__title">⚡ Registrar Incidencia</h2>
              {success && <AlertMessage type="success" message="Incidencia registrada correctamente." />}
              {error && <AlertMessage type="error" message={error} onClose={() => setError(null)} />}
              <form onSubmit={handleSubmitIncidencia} noValidate>
                <fieldset style={{ border: 'none', padding: 0 }}>
                  <legend style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
                    Nivel de criticidad
                  </legend>
                  <div className="incidencia-criticidad" role="group" aria-label="Seleccionar criticidad">
                    {(['informativa', 'advertencia', 'critica'] as Criticidad[]).map(c => (
                      <button
                        key={c}
                        type="button"
                        className={criticidad === c ? `selected-${c}` : ''}
                        onClick={() => setCriticidad(c)}
                        aria-pressed={criticidad === c}
                        id={`crit-${c}`}
                      >
                        {CRITICIDAD_LABELS[c]}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="incidencia-desc" style={{ display: 'block', fontWeight: 600, fontSize: 'var(--font-size-sm)', marginBottom: '0.5rem' }}>
                    Descripción <span aria-hidden="true" style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <textarea
                    id="incidencia-desc"
                    value={descripcion}
                    onChange={e => setDescripcion(e.target.value)}
                    placeholder="Describe la incidencia brevemente..."
                    required
                    rows={3}
                    aria-required="true"
                    style={{ width: '100%' }}
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-block" disabled={sending || !descripcion.trim()} id="btn-registrar-incidencia">
                  {sending ? <><span className="btn-spinner" aria-hidden="true" /> Registrando...</> : '⚡ Registrar incidencia'}
                </button>
              </form>
            </div>
          </div>

          {/* Tabla de incidencias */}
          <div>
            <div className="incidencias-table-wrap">
              <h2 style={{ padding: '1rem 1.5rem', fontSize: 'var(--font-size-lg)', fontWeight: 600, borderBottom: '2px solid var(--color-border)', margin: 0 }}>
                🗒️ Registro de Incidencias ({incidencias.length})
              </h2>
              {incidencias.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✅</div>
                  <p>Sin incidencias registradas</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="incidencias-table" aria-label="Lista de incidencias del evento">
                    <thead>
                      <tr>
                        <th scope="col">Criticidad</th>
                        <th scope="col">Descripción</th>
                        <th scope="col">Hora</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incidencias.map(inc => (
                        <tr key={inc.id} className={`row-${inc.criticidad}`}>
                          <td>
                            <span className={`badge-incidencia badge-incidencia--${inc.criticidad}`} aria-label={`Criticidad: ${inc.criticidad}`}>
                              {CRITICIDAD_LABELS[inc.criticidad as Criticidad]}
                            </span>
                          </td>
                          <td style={{ maxWidth: '300px' }}>{inc.descripcion}</td>
                          <td style={{ color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                            {new Date(inc.creado_en).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
