import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import AlertMessage from '../../components/ui/AlertMessage';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import AccessibleTooltip from '../../components/ui/AccessibleTooltip';
import { adminApi, type LogAuditoria, type PaginatedLogs } from '../../api/adminApi';
import './Auditoria.css';

const TIPOS_ACCION = [
  { value: '', label: 'Todas las acciones' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'REGISTRO', label: 'Registro' },
  { value: 'CAMBIO_ROL', label: 'Cambio de rol' },
  { value: 'ACTIVACION', label: 'Activación de cuenta' },
  { value: 'DESACTIVACION', label: 'Desactivación de cuenta' },
  { value: 'APROBACION_ORGANIZADOR', label: 'Aprobación de organizador' },
];

const ACCION_META: Record<string, { label: string; cls: string }> = {
  LOGIN:                   { label: 'Login',          cls: 'audit-badge--login' },
  REGISTRO:                { label: 'Registro',       cls: 'audit-badge--registro' },
  CAMBIO_ROL:              { label: 'Cambio rol',     cls: 'audit-badge--cambio' },
  ACTIVACION:              { label: 'Activación',     cls: 'audit-badge--activacion' },
  DESACTIVACION:           { label: 'Desactivación',  cls: 'audit-badge--desactivacion' },
  APROBACION_ORGANIZADOR:  { label: 'Aprobación',     cls: 'audit-badge--aprobacion' },
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('es-EC', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
}

export default function AuditoriaPage() {
  const { user, isAuthenticated } = useAuth();

  // ── Estado ─────────────────────────────────────────────────────────────────
  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [paginacion, setPaginacion] = useState({ total: 0, pagina: 1, limite: 50 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filtros, setFiltros] = useState({
    fecha_inicio: '',
    fecha_fin:    '',
    usuario:      '',
    tipo_accion:  '',
  });
  const [filtrosAplicados, setFiltrosAplicados] = useState(filtros);
  const usuarioTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Protección de ruta
  if (!isAuthenticated || user?.rol !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // ── Carga de datos ─────────────────────────────────────────────────────────
  const cargarLogs = useCallback(async (pagina = 1, f = filtrosAplicados) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.listarLogs({ ...f, pagina, limite: paginacion.limite });
      if (res.data) {
        const paged = res.data as PaginatedLogs;
        setLogs(paged.data);
        setPaginacion({ total: paged.total, pagina: paged.pagina, limite: paged.limite });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando logs de auditoría');
    } finally {
      setLoading(false);
    }
  }, [filtrosAplicados, paginacion.limite]);

  useEffect(() => {
    cargarLogs(1, filtrosAplicados);
  }, [filtrosAplicados]);

  const aplicarFiltros = () => {
    setFiltrosAplicados({ ...filtros });
  };

  const limpiarFiltros = () => {
    const empty = { fecha_inicio: '', fecha_fin: '', usuario: '', tipo_accion: '' };
    setFiltros(empty);
    setFiltrosAplicados(empty);
  };

  const handleUsuarioChange = (val: string) => {
    setFiltros(prev => ({ ...prev, usuario: val }));
    if (usuarioTimer.current) clearTimeout(usuarioTimer.current);
    usuarioTimer.current = setTimeout(() => {
      setFiltrosAplicados(prev => ({ ...prev, usuario: val }));
    }, 500);
  };

  // ── Paginación ─────────────────────────────────────────────────────────────
  const totalPaginas = Math.max(1, Math.ceil(paginacion.total / paginacion.limite));

  const irAPagina = (p: number) => {
    if (p < 1 || p > totalPaginas) return;
    cargarLogs(p, filtrosAplicados);
  };

  const hayFiltros = Object.values(filtros).some(v => v !== '');

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className="audit-page" id="main-content">
      <div className="container">
        {/* Encabezado */}
        <header className="admin-page__header">
          <div>
            <h1 className="admin-page__title">Auditoría del Sistema</h1>
            <p className="admin-page__subtitle">
              Trazabilidad completa de las acciones críticas para auditorías de seguridad.
            </p>
          </div>
          <div className="admin-page__stats" aria-label="Estadísticas de auditoría">
            <span className="admin-stat">
              <span className="admin-stat__value">{paginacion.total}</span>
              <span className="admin-stat__label">Registros</span>
            </span>
          </div>
        </header>

        {error && <AlertMessage type="error" message={error} onClose={() => setError(null)} />}

        {/* Panel de filtros */}
        <section className="audit-filters card" aria-label="Filtros de auditoría">
          <h2 className="audit-filters__title">Filtros avanzados</h2>
          <div className="audit-filters__grid">
            <div className="audit-filters__field">
              <label htmlFor="audit-fecha-inicio" className="audit-filters__label">
                Fecha inicio
              </label>
              <input
                id="audit-fecha-inicio"
                type="date"
                className="audit-filters__input"
                value={filtros.fecha_inicio}
                max={filtros.fecha_fin || undefined}
                onChange={(e) => setFiltros(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                aria-label="Filtrar desde fecha"
              />
            </div>
            <div className="audit-filters__field">
              <label htmlFor="audit-fecha-fin" className="audit-filters__label">
                Fecha fin
              </label>
              <input
                id="audit-fecha-fin"
                type="date"
                className="audit-filters__input"
                value={filtros.fecha_fin}
                min={filtros.fecha_inicio || undefined}
                onChange={(e) => setFiltros(prev => ({ ...prev, fecha_fin: e.target.value }))}
                aria-label="Filtrar hasta fecha"
              />
            </div>
            <div className="audit-filters__field">
              <label htmlFor="audit-usuario" className="audit-filters__label">
                Usuario (ID o correo)
              </label>
              <input
                id="audit-usuario"
                type="search"
                className="audit-filters__input"
                placeholder="correo@ejemplo.com o UUID"
                value={filtros.usuario}
                onChange={(e) => handleUsuarioChange(e.target.value)}
                aria-label="Buscar por ID de usuario o correo"
              />
            </div>
            <div className="audit-filters__field">
              <label htmlFor="audit-tipo-accion" className="audit-filters__label">
                Tipo de acción
              </label>
              <select
                id="audit-tipo-accion"
                className="audit-filters__input"
                value={filtros.tipo_accion}
                onChange={(e) => setFiltros(prev => ({ ...prev, tipo_accion: e.target.value }))}
                aria-label="Filtrar por tipo de acción"
              >
                {TIPOS_ACCION.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="audit-filters__actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={aplicarFiltros}
              aria-label="Aplicar filtros de búsqueda"
            >
              Aplicar filtros
            </button>
            {hayFiltros && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={limpiarFiltros}
                aria-label="Limpiar todos los filtros"
              >
                Limpiar
              </button>
            )}
          </div>
        </section>

        {/* Tabla de logs */}
        <div className="audit-table-wrap" role="region" aria-label="Registros de auditoría" aria-live="polite">
          {loading ? (
            <div className="admin-loading" aria-busy="true">
              <LoadingSpinner />
              <p>Cargando registros…</p>
            </div>
          ) : logs.length === 0 ? (
            <p className="admin-empty" role="status">
              No se encontraron registros con los filtros aplicados.
            </p>
          ) : (
            <table className="audit-table" aria-label="Logs de auditoría del sistema">
              <thead>
                <tr>
                  <th scope="col">Marca de tiempo</th>
                  <th scope="col">Dirección IP</th>
                  <th scope="col">Usuario</th>
                  <th scope="col">Acción</th>
                  <th scope="col">Descripción</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const meta = ACCION_META[log.accion];
                  return (
                    <tr key={log.id}>
                      <td data-label="Fecha/Hora" className="audit-table__time">
                        <AccessibleTooltip content={log.creado_en}>
                          <time dateTime={log.creado_en} tabIndex={0}>
                            {formatTimestamp(log.creado_en)}
                          </time>
                        </AccessibleTooltip>
                      </td>
                      <td data-label="IP" className="audit-table__ip">
                        <code>{log.ip_address || '—'}</code>
                      </td>
                      <td data-label="Usuario" className="audit-table__user">
                        <span className="audit-table__email">{log.correo_usuario || '—'}</span>
                        {log.usuario_id && (
                          <AccessibleTooltip content={log.usuario_id}>
                            <span className="audit-table__uid" tabIndex={0}>
                              {log.usuario_id.slice(0, 8)}…
                            </span>
                          </AccessibleTooltip>
                        )}
                      </td>
                      <td data-label="Acción">
                        <span className={`audit-badge ${meta?.cls ?? 'audit-badge--default'}`}>
                          {meta?.label ?? log.accion}
                        </span>
                      </td>
                      <td data-label="Descripción" className="audit-table__desc">
                        {log.descripcion || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación numerada accesible */}
        {!loading && totalPaginas > 1 && (
          <nav className="admin-pagination" aria-label="Paginación de logs de auditoría">
            <button
              type="button"
              className="admin-pagination__btn"
              onClick={() => irAPagina(paginacion.pagina - 1)}
              disabled={paginacion.pagina <= 1}
              aria-label="Página anterior"
            >
              ‹
            </button>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPaginas || Math.abs(p - paginacion.pagina) <= 2)
              .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === 'ellipsis' ? (
                  <span key={`e-${idx}`} className="admin-pagination__ellipsis" aria-hidden="true">…</span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    className={`admin-pagination__btn ${paginacion.pagina === item ? 'admin-pagination__btn--active' : ''}`}
                    onClick={() => irAPagina(item as number)}
                    aria-label={`Página ${item}`}
                    aria-current={paginacion.pagina === item ? 'page' : undefined}
                  >
                    {item}
                  </button>
                )
              )}
            <button
              type="button"
              className="admin-pagination__btn"
              onClick={() => irAPagina(paginacion.pagina + 1)}
              disabled={paginacion.pagina >= totalPaginas}
              aria-label="Página siguiente"
            >
              ›
            </button>
          </nav>
        )}

        {/* Resumen de paginación */}
        {!loading && paginacion.total > 0 && (
          <p className="audit-page__summary" aria-live="polite">
            Mostrando{' '}
            <strong>
              {Math.min((paginacion.pagina - 1) * paginacion.limite + 1, paginacion.total)}–
              {Math.min(paginacion.pagina * paginacion.limite, paginacion.total)}
            </strong>{' '}
            de <strong>{paginacion.total}</strong> registros
          </p>
        )}
      </div>
    </main>
  );
}
