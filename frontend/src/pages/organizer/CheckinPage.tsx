import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { organizerApi, type EventoStats } from '../../api/organizerApi';
import AccessibleTooltip from '../../components/ui/AccessibleTooltip';
import './organizer.css';

type FeedbackState = 'idle' | 'success' | 'error' | 'duplicate';

interface CheckinEntry {
  time: string;
  id: string;
  ok: boolean;
}

// Audio feedback usando Web Audio API
function playBeep(type: 'success' | 'error') {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = type === 'success' ? 880 : 300;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch { /* sin audio disponible */ }
}

export default function CheckinPage() {
  const { eventoId } = useParams<{ eventoId: string }>();
  const { user } = useAuth();

  const [feedback, setFeedback] = useState<FeedbackState>('idle');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackDetail, setFeedbackDetail] = useState('');
  const [stats, setStats] = useState<EventoStats | null>(null);
  const [history, setHistory] = useState<CheckinEntry[]>([]);
  const [manualCode, setManualCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);

  // Cargar stats periódicamente
  useEffect(() => {
    if (!eventoId) return;
    const loadStats = () => organizerApi.stats(eventoId).then(r => setStats(r.data ?? null)).catch(() => null);
    loadStats();
    const interval = setInterval(loadStats, 15000);
    return () => clearInterval(interval);
  }, [eventoId]);

  const showFeedback = useCallback((state: FeedbackState, msg: string, detail = '') => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setFeedback(state);
    setFeedbackMsg(msg);
    setFeedbackDetail(detail);
    playBeep(state === 'success' ? 'success' : 'error');
    feedbackTimerRef.current = window.setTimeout(() => setFeedback('idle'), 5000);
  }, []);

  const processQR = useCallback(async (rawData: string) => {
    if (processing || !eventoId || !rawData.trim()) return;
    setProcessing(true);

    // El QR contiene el inscripcion_id (o JSON con inscripcion_id y boleto_id)
    let inscripcionId = rawData.trim();
    let boletoId = rawData.trim();

    try {
      const parsed = JSON.parse(rawData);
      inscripcionId = parsed.inscripcion_id || rawData;
      boletoId = parsed.boleto_id || rawData;
    } catch { /* rawData es directamente el ID */ }

    try {
      await organizerApi.registrarCheckin({
        evento_id: eventoId,
        inscripcion_id: inscripcionId,
        boleto_id: boletoId,
        revisado_por: user?.id,
      });
      showFeedback('success', '✓ ACCESO PERMITIDO', `ID: ${inscripcionId.substring(0, 8)}...`);
      setHistory(h => [{ time: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }), id: inscripcionId, ok: true }, ...h.slice(0, 9)]);
      // Refrescar contador
      if (eventoId) organizerApi.stats(eventoId).then(r => setStats(r.data ?? null)).catch(() => null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error';
      if (msg.toLowerCase().includes('ya existe') || msg.toLowerCase().includes('duplicad') || msg.toLowerCase().includes('conflict')) {
        showFeedback('duplicate', '⚠ BOLETO DUPLICADO', 'Este boleto ya fue escaneado anteriormente.');
      } else {
        showFeedback('error', '✕ ACCESO DENEGADO', msg);
      }
      setHistory(h => [{ time: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }), id: inscripcionId, ok: false }, ...h.slice(0, 9)]);
    } finally {
      setProcessing(false);
    }
  }, [eventoId, user?.id, processing, showFeedback]);

  // Iniciar cámara y escaneo QR
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);

      // Scan loop usando jsQR si está disponible, o BarcodeDetector
      const scan = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        if (video.readyState < 2) return;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Intentar con BarcodeDetector (nativo)
        if ('BarcodeDetector' in window) {
          try {
            const detector = new (window as unknown as { BarcodeDetector: new (opts: object) => { detect: (img: HTMLCanvasElement) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector({ formats: ['qr_code'] });
            const codes = await detector.detect(canvas);
            if (codes.length > 0) processQR(codes[0].rawValue);
          } catch { /* ignorar */ }
        }
      };
      scanIntervalRef.current = window.setInterval(scan, 500);
    } catch {
      setCameraError('No se pudo acceder a la cámara. Usa el campo de texto manual.');
    }
  }, [processQR]);

  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    setCameraActive(false);
  }, []);

  useEffect(() => () => { stopCamera(); if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current); }, [stopCamera]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) { processQR(manualCode.trim()); setManualCode(''); }
  };

  const feedbackConfig = {
    idle: { icon: '📷', title: 'Esperando escaneo...', cls: 'checkin-feedback--idle' },
    success: { icon: '✅', title: feedbackMsg, cls: 'checkin-feedback--success' },
    error: { icon: '❌', title: feedbackMsg, cls: 'checkin-feedback--error' },
    duplicate: { icon: '⚠️', title: feedbackMsg, cls: 'checkin-feedback--duplicate' },
  }[feedback];

  return (
    <div className="checkin-page" id="main-content">
      {/* Header */}
      <header className="checkin-header" role="banner">
        <div>
          <Link to="/organizador" className="org-back-btn" aria-label="Volver al hub de organizador" style={{ color: 'rgba(255,255,255,0.6)' }}>
            ← Volver
          </Link>
          <h1 style={{ color: '#fff', fontSize: 'var(--font-size-xl)', fontWeight: 700 }}>
            📷 Panel de Check-in
          </h1>
        </div>
        <div className="checkin-counter" aria-live="polite" aria-atomic="true">
          <div className="checkin-counter__label">Asistentes ingresados</div>
          <div className="checkin-counter__number" aria-label={`${stats?.checkins ?? 0} asistentes ingresados de ${stats?.capacidad ?? '?'}`}>
            {stats?.checkins ?? '—'}
            {stats && <span style={{ fontSize: '1.2rem', opacity: 0.5 }}> / {stats.capacidad}</span>}
          </div>
          {stats && (
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'rgba(255,255,255,0.5)' }}>
              {stats.pct_ocupacion}% de ocupación
            </div>
          )}
        </div>
      </header>

      {/* Main area: scanner + feedback */}
      <main className="checkin-main">
        {/* Scanner */}
        <section className="checkin-scanner" aria-label="Escáner de código QR">
          <h2 className="checkin-scanner__title">Escanear código QR</h2>

          <div className="checkin-canvas-wrap" aria-label="Vista de la cámara para escaneo" role="img">
            <video ref={videoRef} playsInline muted aria-hidden="true"
              style={{ display: cameraActive ? 'block' : 'none' }} />
            <canvas ref={canvasRef} aria-hidden="true"
              style={{ display: 'none' }} />
            {!cameraActive && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px', background: 'rgba(255,255,255,0.04)', gap: '1rem' }}>
                <span style={{ fontSize: '4rem' }} aria-hidden="true">📷</span>
                <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '0 1rem' }}>
                  Activa la cámara para escanear
                </p>
              </div>
            )}
            {cameraActive && (
              <div className="checkin-scan-overlay" aria-hidden="true">
                <div className="checkin-scan-frame" />
              </div>
            )}
          </div>

          {cameraError && <p role="alert" style={{ color: '#F87171', fontSize: 'var(--font-size-sm)', textAlign: 'center' }}>{cameraError}</p>}

          <button
            className={`btn btn-lg ${cameraActive ? 'btn-danger' : 'btn-primary'}`}
            onClick={cameraActive ? stopCamera : startCamera}
            id="btn-toggle-camera"
            aria-pressed={cameraActive}
          >
            {cameraActive ? '⏹ Detener cámara' : '▶ Activar cámara'}
          </button>

          {/* Manual input */}
          <form onSubmit={handleManualSubmit} style={{ width: '100%', maxWidth: '380px' }} aria-label="Ingreso manual de código">
            <label htmlFor="manual-code" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 'var(--font-size-sm)', display: 'block', marginBottom: '0.5rem' }}>
              O ingresa el ID manualmente:
            </label>
            <div className="checkin-manual">
              <input
                id="manual-code"
                type="text"
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                placeholder="ID de inscripción o boleto..."
                aria-label="Código de inscripción manual"
                disabled={processing}
              />
              <AccessibleTooltip content="Confirmar check-in">
                <button type="submit" className="btn btn-primary" disabled={processing || !manualCode.trim()} id="btn-manual-checkin" aria-label="Confirmar check-in manual">
                  ✓
                </button>
              </AccessibleTooltip>
            </div>
          </form>
        </section>

        {/* Feedback visual dual */}
        <section
          className={`checkin-feedback ${feedbackConfig.cls}`}
          role="status"
          aria-live="assertive"
          aria-atomic="true"
          aria-label={`Estado: ${feedbackConfig.title}`}
        >
          <div className="checkin-feedback__icon" aria-hidden="true">{feedbackConfig.icon}</div>
          <div className="checkin-feedback__title">{feedbackConfig.title}</div>
          {feedbackDetail && <p className="checkin-feedback__desc">{feedbackDetail}</p>}
          {processing && <div style={{ marginTop: '1rem', opacity: 0.6 }}>Procesando...</div>}
        </section>
      </main>

      {/* Historial reciente */}
      {history.length > 0 && (
        <aside className="checkin-recent" aria-label="Historial reciente de accesos">
          <div className="checkin-recent__title">Últimos accesos</div>
          <ul className="checkin-recent__list" role="list">
            {history.map((h, i) => (
              <li key={i} className="checkin-recent__item">
                <span className={`checkin-recent__dot checkin-recent__dot--${h.ok ? 'ok' : 'err'}`} aria-hidden="true" />
                <span>{h.time}</span>
                <span style={{ opacity: 0.5, fontSize: '0.7rem' }}>{h.id.substring(0, 8)}…</span>
                <span aria-label={h.ok ? 'Acceso permitido' : 'Acceso denegado'}>{h.ok ? '✓' : '✕'}</span>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}
