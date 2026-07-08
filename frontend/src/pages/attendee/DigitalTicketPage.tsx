import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { api } from '../../api/client';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import AlertMessage from '../../components/ui/AlertMessage';
import './attendee.css';

/* ── Types ─────────────────────────────────────────────────────────────── */

interface BoletoData {
  inscripcion_id: string;
  evento_titulo: string;
  evento_inicio: string;
  evento_fin: string;
  lugar_nombre?: string;
  lugar_ciudad?: string;
  asistente_nombre: string;
  codigo_boleto: string;
  codigo_qr: string;
  estado: string;
  emitido_en: string;
}

const CACHE_KEY_PREFIX = 'boleto_cache_';

/* ── Helpers ────────────────────────────────────────────────────────────── */

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('es-EC', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('es-EC', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
}

/* ── Main Component ─────────────────────────────────────────────────────── */

export default function DigitalTicketPage() {
  const { inscripcionId } = useParams<{ inscripcionId: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [boleto, setBoleto] = useState<BoletoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [fromCache, setFromCache] = useState(false);

  // Monitor online/offline
  useEffect(() => {
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Load boleto: try network first, fallback to cache
  useEffect(() => {
    if (!inscripcionId) return;
    const cacheKey = `${CACHE_KEY_PREFIX}${inscripcionId}`;

    const loadFromCache = (): BoletoData | null => {
      try {
        const cached = localStorage.getItem(cacheKey);
        return cached ? JSON.parse(cached) : null;
      } catch {
        return null;
      }
    };

    const saveToCache = (data: BoletoData) => {
      try {
        localStorage.setItem(cacheKey, JSON.stringify(data));
      } catch { /* storage full — ignore */ }
    };

    const load = async () => {
      // If offline, try cache immediately
      if (!navigator.onLine) {
        const cached = loadFromCache();
        if (cached) {
          setBoleto(cached);
          setFromCache(true);
          setLoading(false);
          return;
        }
        setError('Sin conexión a internet y no hay datos en caché para este boleto.');
        setLoading(false);
        return;
      }

      try {
        const res = await api.get<{
          id: string;
          evento_id: string;
          asistente_id: string;
          estado: string;
          registrado_en: string;
          boleto?: {
            id: string;
            inscripcion_id: string;
            codigo_boleto: string;
            codigo_qr: string;
            emitido_en: string;
            estado: string;
          };
          // We'll also need event and user info — we'll enrich manually
        }>(`/inscripciones/${inscripcionId}`);

        const inscData = res.data;
        if (!inscData || !inscData.boleto) {
          throw new Error('Boleto no encontrado para esta inscripción');
        }

        // Build BoletoData — we may not have full event/user info from this endpoint,
        // so we use what's available and fill gaps from cache
        const cached = loadFromCache();
        const bd: BoletoData = {
          inscripcion_id: inscripcionId,
          evento_titulo: cached?.evento_titulo ?? 'Evento',
          evento_inicio: cached?.evento_inicio ?? inscData.registrado_en,
          evento_fin: cached?.evento_fin ?? inscData.registrado_en,
          lugar_nombre: cached?.lugar_nombre,
          lugar_ciudad: cached?.lugar_ciudad,
          asistente_nombre: cached?.asistente_nombre ?? 'Asistente',
          codigo_boleto: inscData.boleto.codigo_boleto,
          codigo_qr: inscData.boleto.codigo_qr,
          estado: inscData.boleto.estado,
          emitido_en: inscData.boleto.emitido_en,
        };

        saveToCache(bd);
        setBoleto(bd);
        setFromCache(false);
      } catch {
        // Try cache as fallback
        const cached = loadFromCache();
        if (cached) {
          setBoleto(cached);
          setFromCache(true);
        } else {
          setError('No se pudo cargar el boleto. Verifica tu conexión.');
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [inscripcionId]);

  // Generate QR code on canvas when boleto is available
  useEffect(() => {
    if (!boleto || !canvasRef.current) return;

    QRCode.toCanvas(canvasRef.current, boleto.codigo_qr || boleto.codigo_boleto, {
      width: 220,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
      errorCorrectionLevel: 'H',
    }).catch(err => {
      console.error('Error generating QR:', err);
    });
  }, [boleto]);

  if (loading) return <LoadingSpinner message="Cargando tu boleto..." />;

  if (error || !boleto) {
    return (
      <main id="main-content" className="ticket-page">
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <AlertMessage type="error" message={error ?? 'Boleto no disponible'} />
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/')}
            style={{ marginTop: 'var(--space-4)' }}
          >
            Volver al inicio
          </button>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="ticket-page">
      <div>
        {/* Offline badge */}
        {isOffline && (
          <div
            role="status"
            aria-live="polite"
            style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}
          >
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
              background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.4)',
              color: '#FBBF24', borderRadius: 'var(--radius-full)',
              padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--font-size-sm)', fontWeight: 600,
            }}>
              📵 Modo offline — boleto desde caché
            </span>
          </div>
        )}

        {/* Ticket Card */}
        <article
          className="ticket-card"
          aria-label={`Boleto digital para el evento ${boleto.evento_titulo}`}
        >
          {/* Header */}
          <header className="ticket-card__header">
            <p className="ticket-card__attendee" aria-label="Asistente">
              👤 {boleto.asistente_nombre}
            </p>
            <h1 className="ticket-card__event-name">{boleto.evento_titulo}</h1>
          </header>

          {/* Notch separator */}
          <div className="ticket-notch" aria-hidden="true">
            <div className="ticket-notch__left" />
            <div className="ticket-notch__dashes" />
            <div className="ticket-notch__right" />
          </div>

          {/* QR Section */}
          <section className="ticket-card__qr" aria-label="Código QR de acceso">
            <div
              className="ticket-card__qr-container"
              role="img"
              aria-label={`Código QR del boleto. Código alfanumérico de respaldo: ${boleto.codigo_boleto}`}
            >
              <canvas
                ref={canvasRef}
                aria-hidden="true"
              />
            </div>

            {/* Alphanumeric backup code — always visible */}
            <div>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textAlign: 'center', marginBottom: 'var(--space-1)' }}>
                Código de respaldo
              </p>
              <p
                className="ticket-card__code"
                aria-label={`Código alfanumérico de respaldo: ${boleto.codigo_boleto}`}
              >
                {boleto.codigo_boleto}
              </p>
            </div>
          </section>

          {/* Notch separator */}
          <div className="ticket-notch" aria-hidden="true">
            <div className="ticket-notch__left" />
            <div className="ticket-notch__dashes" />
            <div className="ticket-notch__right" />
          </div>

          {/* Footer Details */}
          <footer className="ticket-card__footer">
            <dl>
              <div className="ticket-detail">
                <span className="ticket-detail__icon" aria-hidden="true">📅</span>
                <div className="ticket-detail__content">
                  <dt className="ticket-detail__label">Fecha</dt>
                  <dd className="ticket-detail__value">{formatDateShort(boleto.evento_inicio)}</dd>
                </div>
              </div>

              <div className="ticket-detail">
                <span className="ticket-detail__icon" aria-hidden="true">🕐</span>
                <div className="ticket-detail__content">
                  <dt className="ticket-detail__label">Hora</dt>
                  <dd className="ticket-detail__value">{formatTime(boleto.evento_inicio)}</dd>
                </div>
              </div>

              {boleto.lugar_nombre && (
                <div className="ticket-detail">
                  <span className="ticket-detail__icon" aria-hidden="true">📍</span>
                  <div className="ticket-detail__content">
                    <dt className="ticket-detail__label">Lugar</dt>
                    <dd className="ticket-detail__value">
                      {boleto.lugar_nombre}
                      {boleto.lugar_ciudad ? `, ${boleto.lugar_ciudad}` : ''}
                    </dd>
                  </div>
                </div>
              )}

              <div className="ticket-detail">
                <span className="ticket-detail__icon" aria-hidden="true">✅</span>
                <div className="ticket-detail__content">
                  <dt className="ticket-detail__label">Estado del boleto</dt>
                  <dd className="ticket-detail__value" style={{ textTransform: 'capitalize' }}>
                    {boleto.estado}
                  </dd>
                </div>
              </div>
            </dl>

            {/* Cache indicator */}
            {fromCache && (
              <div className="ticket-offline-badge" role="status" aria-live="polite">
                <span aria-hidden="true">💾</span>
                Boleto disponible offline
              </div>
            )}
          </footer>
        </article>

        {/* Actions */}
        <div className="ticket-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => window.print()}
            aria-label="Imprimir boleto"
            id="btn-print-ticket"
          >
            🖨️ Imprimir
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
            onClick={() => navigate('/')}
          >
            Volver al inicio
          </button>
        </div>

        {/* WCAG: Accessible description for screen readers */}
        <p className="sr-only" aria-live="polite">
          {`Boleto digital para ${boleto.asistente_nombre}. Evento: ${boleto.evento_titulo}. `}
          {`Fecha: ${formatDateTime(boleto.evento_inicio)}. `}
          {boleto.lugar_nombre ? `Lugar: ${boleto.lugar_nombre}. ` : ''}
          {`Código de acceso: ${boleto.codigo_boleto}.`}
        </p>
      </div>
    </main>
  );
}
