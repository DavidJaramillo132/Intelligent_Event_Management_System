import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { organizerApi, type EventoOrganizador } from '../../api/organizerApi';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import AlertMessage from '../../components/ui/AlertMessage';
import './organizer.css';

export default function OrganizerHub() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [eventos, setEventos] = useState<EventoOrganizador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    organizerApi.misEventos(user.id)
      .then(r => setEventos(r.data || []))
      .catch(() => setError('No se pudieron cargar los eventos.'))
      .finally(() => setLoading(false));
  }, [user?.id]);

  if (loading) return <LoadingSpinner message="Cargando tus eventos..." />;

  return (
    <main className="org-hub" id="main-content">
      <div className="container">
        <div className="org-hub__header">
          <div>
            <h1 className="org-hub__title">🎪 Panel del Organizador</h1>
            <p style={{ color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              Gestiona todos tus eventos desde un solo lugar.
            </p>
          </div>
          <Link to="/eventos/crear" className="btn btn-primary" id="hub-create-event">
            ＋ Crear nuevo evento
          </Link>
        </div>

        {error && <AlertMessage type="error" message={error} onClose={() => setError(null)} />}

        {eventos.length === 0 ? (
          <div className="org-empty animate-fade-in">
            <div className="org-empty__icon">🎭</div>
            <h2 className="org-empty__title">Aún no tienes eventos</h2>
            <p>Crea tu primer evento y comienza a gestionar asistentes.</p>
            <Link to="/eventos/crear" className="btn btn-primary btn-lg" style={{ marginTop: '1.5rem' }}>
              Crear mi primer evento
            </Link>
          </div>
        ) : (
          <div className="org-hub__grid animate-fade-in">
            {eventos.map(ev => (
              <article key={ev.id} className="org-event-card" aria-label={`Evento: ${ev.titulo}`}>
                <div className="org-event-card__image">
                  {ev.imagen_portada ? (
                    <img src={ev.imagen_portada.startsWith('http') ? ev.imagen_portada : `/uploads/${ev.imagen_portada.split('/').pop()}`}
                         alt={ev.titulo}
                         onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <span aria-hidden="true">🎪</span>
                  )}
                </div>
                <div className="org-event-card__body">
                  <div>
                    <span className={`org-event-card__badge org-event-card__badge--${ev.estado || 'borrador'}`}>
                      {ev.estado === 'publicado' ? '✓ Publicado' : ev.estado === 'cancelado' ? '✕ Cancelado' : '✎ Borrador'}
                    </span>
                  </div>
                  <h2 className="org-event-card__title">{ev.titulo}</h2>
                  <p className="org-event-card__meta">
                    📅 {new Date(ev.inicio).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {ev.lugar && ` · 📍 ${ev.lugar.nombre}`}
                  </p>
                  <p className="org-event-card__meta">
                    👥 Capacidad: {ev.capacidad} · 💵 ${ev.costo}
                  </p>
                  <div className="org-event-card__actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => navigate(`/organizador/eventos/${ev.id}/monitor`)}
                      id={`btn-monitor-${ev.id}`}
                      aria-label={`Ver monitor en tiempo real de ${ev.titulo}`}
                    >
                      📊 Monitor
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => navigate(`/organizador/eventos/${ev.id}/checkin`)}
                      id={`btn-checkin-${ev.id}`}
                      aria-label={`Panel de check-in de ${ev.titulo}`}
                    >
                      📷 Check-in
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => navigate(`/organizador/eventos/${ev.id}/reporte`)}
                      id={`btn-reporte-${ev.id}`}
                      aria-label={`Ver reporte ejecutivo de ${ev.titulo}`}
                    >
                      📈 Reporte
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
