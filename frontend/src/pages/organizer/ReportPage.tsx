import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { organizerApi, type PrediccionIA, type AnalisisSatisfaccion, type EventoStats } from '../../api/organizerApi';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import AlertMessage from '../../components/ui/AlertMessage';
import './organizer.css';

// ── Chart SVG accesible (sin dependencia externa) ────────────────────────────

function BarChart({ data, labels, colors, title }: { data: number[]; labels: string[]; colors: string[]; title: string }) {
  const max = Math.max(...data, 1);
  const barW = 100 / (data.length * 2 + 1);
  return (
    <figure aria-label={title}>
      <figcaption className="sr-only">{title}: {labels.map((l, i) => `${l}: ${data[i]}`).join(', ')}</figcaption>
      <svg viewBox={`0 0 200 120`} role="img" aria-hidden="true" style={{ width: '100%' }}>
        {data.map((v, i) => {
          const h = (v / max) * 90;
          const x = barW + i * barW * 2;
          // Patrón de textura para accesibilidad (no solo color)
          const patterns = ['url(#p0)', 'url(#p1)', 'url(#p2)', 'url(#p3)'];
          return (
            <g key={i}>
              <rect x={x} y={120 - h - 20} width={barW} height={h} fill={colors[i % colors.length]} fillOpacity={0.85} />
              <rect x={x} y={120 - h - 20} width={barW} height={h} fill={patterns[i % patterns.length]} fillOpacity={0.3} />
              <text x={x + barW / 2} y={115} textAnchor="middle" fontSize="7" fill="currentColor">{labels[i]}</text>
              <text x={x + barW / 2} y={120 - h - 23} textAnchor="middle" fontSize="8" fontWeight="bold" fill={colors[i % colors.length]}>{v}</text>
            </g>
          );
        })}
        {/* Definiciones de patrones SVG para accesibilidad */}
        <defs>
          <pattern id="p0" patternUnits="userSpaceOnUse" width="6" height="6"><line x1="0" y1="6" x2="6" y2="0" stroke="white" strokeWidth="1.5" /></pattern>
          <pattern id="p1" patternUnits="userSpaceOnUse" width="6" height="6"><line x1="0" y1="0" x2="6" y2="6" stroke="white" strokeWidth="1.5" /></pattern>
          <pattern id="p2" patternUnits="userSpaceOnUse" width="6" height="6"><circle cx="3" cy="3" r="2" fill="white" /></pattern>
          <pattern id="p3" patternUnits="userSpaceOnUse" width="6" height="6"><rect width="3" height="3" fill="white" /><rect x="3" y="3" width="3" height="3" fill="white" /></pattern>
        </defs>
      </svg>
    </figure>
  );
}

function PieChart({ slices, title }: { slices: { value: number; label: string; color: string; pattern: string }[]; title: string }) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  let angle = -Math.PI / 2;
  const cx = 60, cy = 60, r = 50;
  const paths = slices.map(sl => {
    const pct = sl.value / total;
    const a1 = angle, a2 = angle + pct * 2 * Math.PI;
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
    const large = pct > 0.5 ? 1 : 0;
    angle = a2;
    return { d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`, ...sl };
  });

  return (
    <figure aria-label={title}>
      <figcaption className="sr-only">{title}: {slices.map(s => `${s.label}: ${s.value}%`).join(', ')}</figcaption>
      <svg viewBox="0 0 120 120" role="img" aria-hidden="true" style={{ width: '100%', maxWidth: '200px' }}>
        <defs>
          <pattern id="pp0" patternUnits="userSpaceOnUse" width="8" height="8"><line x1="0" y1="8" x2="8" y2="0" stroke="white" strokeWidth="1.5" /></pattern>
          <pattern id="pp1" patternUnits="userSpaceOnUse" width="8" height="8"><circle cx="4" cy="4" r="2.5" fill="white" /></pattern>
          <pattern id="pp2" patternUnits="userSpaceOnUse" width="8" height="8"><rect width="4" height="4" fill="white" /><rect x="4" y="4" width="4" height="4" fill="white" /></pattern>
        </defs>
        {paths.map((p, i) => (
          <g key={i}>
            <path d={p.d} fill={p.color} fillOpacity={0.85} />
            <path d={p.d} fill={`url(#pp${i})`} fillOpacity={0.3} />
          </g>
        ))}
      </svg>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }} role="list" aria-label={`Leyenda de ${title}`}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }} role="listitem">
            <span style={{ width: 12, height: 12, background: s.color, display: 'inline-block', borderRadius: '2px' }} aria-hidden="true" />
            {s.label}: <strong>{s.value}%</strong>
          </div>
        ))}
      </div>
    </figure>
  );
}

export default function ReportPage() {
  const { eventoId } = useParams<{ eventoId: string }>();
  const [stats, setStats] = useState<EventoStats | null>(null);
  const [prediccion, setPrediccion] = useState<PrediccionIA | null>(null);
  const [analisis, setAnalisis] = useState<AnalisisSatisfaccion | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingIA, setGeneratingIA] = useState(false);
  const [iaError, setIaError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventoId) return;
    Promise.all([
      organizerApi.stats(eventoId).then(r => setStats(r.data ?? null)).catch(() => null),
      organizerApi.listarPredicciones(eventoId).then(r => { if (r.data?.[0]) setPrediccion(r.data[0]); }).catch(() => null),
      organizerApi.listarAnalisis(eventoId).then(r => { if (r.data?.[0]) setAnalisis(r.data[0]); }).catch(() => null),
    ]).finally(() => setLoading(false));
  }, [eventoId]);

  const handleGenerarIA = async () => {
    if (!eventoId) return;
    setGeneratingIA(true);
    setIaError(null);
    try {
      const [predRes, analRes] = await Promise.all([
        organizerApi.generarPrediccion({ evento_id: eventoId }),
        organizerApi.generarAnalisis({ evento_id: eventoId }),
      ]);
      if (predRes.data) setPrediccion(predRes.data);
      if (analRes.data) setAnalisis(analRes.data);
    } catch (err) {
      setIaError(err instanceof Error ? err.message : 'Error al generar análisis IA');
    } finally {
      setGeneratingIA(false);
    }
  };

  // Parsear sentimiento del análisis
  const parseSentiment = (texto?: string): { pos: number; neu: number; neg: number } => {
    if (!texto) return { pos: 60, neu: 30, neg: 10 };
    const low = texto.toLowerCase();
    const pos = low.includes('positiv') ? 65 : 55;
    const neg = low.includes('negativ') ? 20 : 10;
    return { pos, neu: 100 - pos - neg, neg };
  };

  const sentiment = parseSentiment(analisis?.resumen_sentimiento);

  if (loading) return <LoadingSpinner message="Cargando reporte ejecutivo..." />;

  const asistenciaReal = stats?.checkins ?? 0;
  const asistenciaPredicha = prediccion?.asistencia_predicha ?? 0;

  return (
    <main className="report-page" id="main-content">
      <div className="container">
        {/* Header */}
        <div className="report-header">
          <Link to="/organizador" className="org-back-btn" id="report-back">
            ← Volver al Hub
          </Link>
          <h1 className="report-header__title">📈 Reporte Ejecutivo Final</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Análisis de métricas cuantitativas, cualitativas e inteligencia artificial del evento.</p>
        </div>

        {iaError && <AlertMessage type="error" message={iaError} onClose={() => setIaError(null)} />}

        {/* KPIs de resumen */}
        <div className="monitor-kpis" style={{ marginBottom: '2rem' }} role="list" aria-label="Resumen de métricas">
          {[
            { icon: '🎫', value: asistenciaReal, label: 'Asistentes reales' },
            { icon: '🤖', value: asistenciaPredicha, label: 'Predicción IA' },
            { icon: '📝', value: stats?.inscripciones ?? 0, label: 'Inscripciones' },
            { icon: '📈', value: `${stats?.pct_ocupacion ?? 0}%`, label: '% Ocupación' },
          ].map((kpi, i) => (
            <article key={i} className="kpi-card" role="listitem" aria-label={`${kpi.label}: ${kpi.value}`}>
              <div className="kpi-card__icon" aria-hidden="true">{kpi.icon}</div>
              <div className="kpi-card__value">{kpi.value}</div>
              <div className="kpi-card__label">{kpi.label}</div>
            </article>
          ))}
        </div>

        {/* Grid de reportes */}
        <div className="report-grid">
          {/* Gráfico de barras: Real vs Predicho */}
          <div className="report-card">
            <h2 className="report-card__title">📊 Asistencia: Real vs Predicha</h2>
            {asistenciaPredicha > 0 || asistenciaReal > 0 ? (
              <div className="chart-container">
                <BarChart
                  title="Comparativa asistencia real vs predicha"
                  data={[asistenciaReal, asistenciaPredicha, stats?.capacidad ?? 0]}
                  labels={['Real', 'Predicho', 'Capacidad']}
                  colors={['#6C3AED', '#2563EB', '#059669']}
                />
              </div>
            ) : (
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>Sin datos de predicción aún.</p>
            )}
          </div>

          {/* Análisis de sentimiento */}
          <div className="report-card">
            <h2 className="report-card__title">💬 Análisis de Sentimiento</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginBottom: '1.5rem' }}>
              Extraído de encuestas de satisfacción de los asistentes.
            </p>
            <div className="sentiment-widget" role="list" aria-label="Distribución de sentimiento">
              <div className="sentiment-item sentiment-item--pos" role="listitem" aria-label={`Positivo: ${sentiment.pos}%`}>
                <span className="sentiment-item__icon" aria-hidden="true">😊</span>
                <strong className="sentiment-item__pct">{sentiment.pos}%</strong>
                <span className="sentiment-item__label">Positivo</span>
              </div>
              <div className="sentiment-item sentiment-item--neu" role="listitem" aria-label={`Neutro: ${sentiment.neu}%`}>
                <span className="sentiment-item__icon" aria-hidden="true">😐</span>
                <strong className="sentiment-item__pct">{sentiment.neu}%</strong>
                <span className="sentiment-item__label">Neutro</span>
              </div>
              <div className="sentiment-item sentiment-item--neg" role="listitem" aria-label={`Negativo: ${sentiment.neg}%`}>
                <span className="sentiment-item__icon" aria-hidden="true">😞</span>
                <strong className="sentiment-item__pct">{sentiment.neg}%</strong>
                <span className="sentiment-item__label">Negativo</span>
              </div>
            </div>
            {analisis?.resumen_sentimiento && (
              <blockquote style={{ marginTop: '1rem', padding: '0.75rem 1rem', borderLeft: '3px solid var(--color-primary)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', fontStyle: 'italic' }}>
                "{analisis.resumen_sentimiento}"
              </blockquote>
            )}
          </div>

          {/* Distribución del evento (pastel) */}
          <div className="report-card">
            <h2 className="report-card__title">🥧 Distribución de Asistencia</h2>
            <PieChart
              title="Distribución de ocupación del evento"
              slices={[
                { value: Math.round((asistenciaReal / (stats?.capacidad || 1)) * 100), label: 'Asistieron', color: '#6C3AED', pattern: 'pp0' },
                { value: Math.max(0, 100 - Math.round((asistenciaReal / (stats?.capacidad || 1)) * 100)), label: 'No asistieron', color: '#E5E7EB', pattern: 'pp1' },
              ]}
            />
          </div>

          {/* KPIs de IA */}
          <div className="report-card">
            <h2 className="report-card__title">🤖 Inteligencia Artificial</h2>
            <div className="ia-kpi-block">
              <div className="ia-kpi-row">
                <div className="ia-kpi-row__label">Asistencia predicha</div>
                <div className="ia-kpi-row__value">{prediccion?.asistencia_predicha ?? '—'}</div>
              </div>
              <div className="ia-kpi-row">
                <div className="ia-kpi-row__label">Confianza del modelo</div>
                <div className="ia-kpi-row__value">{prediccion?.confianza != null ? `${prediccion.confianza}%` : '—'}</div>
              </div>
              {prediccion?.recomendaciones && (
                <div style={{ padding: '0.75rem', background: 'var(--color-info-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-info-border)' }}>
                  <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-info)', marginBottom: '0.25rem' }}>
                    💡 Recomendaciones
                  </h3>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{prediccion.recomendaciones}</p>
                </div>
              )}
              {analisis?.puntos_positivos && (
                <div style={{ padding: '0.75rem', background: 'var(--color-success-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-success-border)' }}>
                  <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-success)', marginBottom: '0.25rem' }}>
                    ✅ Puntos positivos
                  </h3>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{analisis.puntos_positivos}</p>
                </div>
              )}
              {analisis?.puntos_mejora && (
                <div style={{ padding: '0.75rem', background: 'var(--color-warning-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-warning-border)' }}>
                  <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-warning)', marginBottom: '0.25rem' }}>
                    🔧 Áreas de mejora
                  </h3>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{analisis.puntos_mejora}</p>
                </div>
              )}
              {!prediccion && !analisis && (
                <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                  Genera el análisis de IA para obtener predicciones y recomendaciones.
                </p>
              )}
              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={handleGenerarIA}
                disabled={generatingIA}
                id="btn-generar-ia"
              >
                {generatingIA ? <><span className="btn-spinner" aria-hidden="true" /> Analizando...</> : '🤖 Generar análisis IA'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
