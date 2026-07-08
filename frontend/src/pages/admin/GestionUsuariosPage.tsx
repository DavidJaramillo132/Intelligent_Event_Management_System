import { useState, useEffect, useRef, useCallback, type KeyboardEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import AlertMessage from '../../components/ui/AlertMessage';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import AccessibleTooltip from '../../components/ui/AccessibleTooltip';
import { adminApi, type UsuarioAdmin } from '../../api/adminApi';
import './GestionUsuarios.css';

type ConfirmPayload =
  | { type: 'rol'; usuario: UsuarioAdmin; nuevoRol: string }
  | { type: 'estado'; usuario: UsuarioAdmin; nuevoActivo: boolean };

// ── Modal de confirmación accesible ──────────────────────────────────────────
function ConfirmModal({
  payload,
  onConfirm,
  onCancel,
}: {
  payload: ConfirmPayload;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const titleId = 'confirm-modal-title';
  const descId = 'confirm-modal-desc';

  // Enfocar "Cancelar" al abrir (requisito de seguridad WCAG)
  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  // Trampa de foco y cierre con Escape
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      onCancel();
      return;
    }
    if (e.key === 'Tab') {
      const focusable = [cancelRef.current, confirmRef.current].filter(Boolean) as HTMLButtonElement[];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  };

  let title = '';
  let description = '';
  let confirmLabel = 'Confirmar';
  let confirmClass = 'btn btn-primary';

  if (payload.type === 'rol') {
    const rolLabels: Record<string, string> = {
      asistente: 'Asistente',
      organizador: 'Organizador',
      admin: 'Administrador',
    };
    title = 'Cambiar rol de usuario';
    description = `¿Está seguro de cambiar el rol de "${payload.usuario.nombre} ${payload.usuario.apellido}" a "${rolLabels[payload.nuevoRol] ?? payload.nuevoRol}"?`;
    confirmLabel = 'Cambiar rol';
  } else if (payload.type === 'estado') {
    title = payload.nuevoActivo ? 'Activar cuenta' : 'Desactivar cuenta';
    description = payload.nuevoActivo
      ? `¿Activar la cuenta de "${payload.usuario.nombre} ${payload.usuario.apellido}"?`
      : `¿Desactivar la cuenta de "${payload.usuario.nombre} ${payload.usuario.apellido}"? El usuario no podrá iniciar sesión.`;
    confirmLabel = payload.nuevoActivo ? 'Activar' : 'Desactivar';
    confirmClass = payload.nuevoActivo ? 'btn btn-primary' : 'btn btn-danger';
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onCancel}>
      <div
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="modal-header">
          <h2 id={titleId} className="modal-title">{title}</h2>
        </div>
        <div className="modal-body">
          <p id={descId} className="modal-description">{description}</p>
        </div>
        <div className="modal-footer">
          {/* Cancelar enfocado por defecto — previene cambios accidentales */}
          <button
            ref={cancelRef}
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={confirmClass}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function GestionUsuariosPage() {
  const { user, isAuthenticated } = useAuth();

  // ── Estado ─────────────────────────────────────────────────────────────────
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [paginacion, setPaginacion] = useState({ total: 0, pagina: 1, limite: 20 });
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmPayload, setConfirmPayload] = useState<ConfirmPayload | null>(null);
  const [showCrearUsuario, setShowCrearUsuario] = useState(false);

  const [filtros, setFiltros] = useState({ busqueda: '', rol: '', estado: '' });
  const [busquedaInput, setBusquedaInput] = useState('');
  const busquedaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Protección de ruta
  if (!isAuthenticated || user?.rol !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // ── Carga de datos ─────────────────────────────────────────────────────────
  const cargarUsuarios = useCallback(async (pagina = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.listarUsuarios({
        pagina,
        limite: paginacion.limite,
        ...filtros,
      });
      if (res.data) {
        setUsuarios(res.data.data);
        setPaginacion({ total: res.data.total, pagina: res.data.pagina, limite: res.data.limite });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando usuarios');
    } finally {
      setLoading(false);
    }
  }, [filtros, paginacion.limite]);

  useEffect(() => {
    cargarUsuarios(1);
  }, [filtros]);

  // Debounce para búsqueda
  const handleBusqueda = (val: string) => {
    setBusquedaInput(val);
    if (busquedaTimer.current) clearTimeout(busquedaTimer.current);
    busquedaTimer.current = setTimeout(() => {
      setFiltros(prev => ({ ...prev, busqueda: val }));
    }, 400);
  };

  // ── Acciones con confirmación ──────────────────────────────────────────────
  const solicitarCambioRol = (usuario: UsuarioAdmin, nuevoRol: string) => {
    if (nuevoRol === usuario.rol) return;
    setConfirmPayload({ type: 'rol', usuario, nuevoRol });
  };

  const solicitarCambioEstado = (usuario: UsuarioAdmin) => {
    setConfirmPayload({ type: 'estado', usuario, nuevoActivo: !usuario.activo });
  };

  const ejecutarAccion = async () => {
    if (!confirmPayload) return;
    const id = confirmPayload.usuario.id;
    setConfirmPayload(null);
    setActionLoading(id);
    setError(null);
    try {
      if (confirmPayload.type === 'rol') {
        await adminApi.actualizarRol(id, confirmPayload.nuevoRol);
        setSuccess(`Rol actualizado para ${confirmPayload.usuario.nombre}`);
      } else if (confirmPayload.type === 'estado') {
        await adminApi.actualizarEstado(id, confirmPayload.nuevoActivo);
        setSuccess(`Cuenta ${confirmPayload.nuevoActivo ? 'activada' : 'desactivada'}`);
      }
      await cargarUsuarios(paginacion.pagina);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error ejecutando la acción');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Paginación ─────────────────────────────────────────────────────────────
  const totalPaginas = Math.max(1, Math.ceil(paginacion.total / paginacion.limite));

  const irAPagina = (p: number) => {
    if (p < 1 || p > totalPaginas) return;
    cargarUsuarios(p);
  };

  const handleCrearUsuario = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      nombre: formData.get('nombre') as string,
      apellido: formData.get('apellido') as string,
      correo_electronico: formData.get('correo') as string,
      contrasena: formData.get('contrasena') as string,
      rol: formData.get('rol') as string,
    };
    
    setError(null);
    try {
      await adminApi.crearUsuario(data);
      setSuccess('Usuario creado exitosamente.');
      setShowCrearUsuario(false);
      cargarUsuarios(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear usuario');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className="admin-page" id="main-content">
      <div className="container">
        {/* Encabezado */}
        <header className="admin-page__header">
          <div>
            <h1 className="admin-page__title">Gestión de Usuarios</h1>
            <p className="admin-page__subtitle">
              Administra accesos, roles y estado de todas las cuentas de la plataforma.
            </p>
          </div>
          <div className="admin-page__stats" aria-label="Estadísticas">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowCrearUsuario(true)}
              aria-label="Registrar un nuevo usuario"
            >
              + Crear Usuario
            </button>
            <span className="admin-stat">
              <span className="admin-stat__value">{paginacion.total}</span>
              <span className="admin-stat__label">Total</span>
            </span>
          </div>
        </header>

        {/* Alertas */}
        {error && <AlertMessage type="error" message={error} onClose={() => setError(null)} />}
        {success && <AlertMessage type="success" message={success} onClose={() => setSuccess(null)} />}

        {/* Filtros */}
        <div className="admin-filters" role="search" aria-label="Filtros de usuarios">
            <div className="admin-filters__field">
              <label htmlFor="filter-busqueda" className="admin-filters__label">
                Buscar usuario
              </label>
              <input
                id="filter-busqueda"
                type="search"
                className="admin-filters__input"
                placeholder="Nombre, apellido o correo…"
                value={busquedaInput}
                onChange={(e) => handleBusqueda(e.target.value)}
                aria-label="Buscar por nombre, apellido o correo"
              />
            </div>
            <div className="admin-filters__field">
              <label htmlFor="filter-rol" className="admin-filters__label">Rol</label>
              <select
                id="filter-rol"
                className="admin-filters__select"
                value={filtros.rol}
                onChange={(e) => setFiltros(prev => ({ ...prev, rol: e.target.value }))}
              >
                <option value="">Todos los roles</option>
                <option value="asistente">Asistente</option>
                <option value="organizador">Organizador</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="admin-filters__field">
              <label htmlFor="filter-estado" className="admin-filters__label">Estado</label>
              <select
                id="filter-estado"
                className="admin-filters__select"
                value={filtros.estado}
                onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
              >
                <option value="">Todos</option>
                <option value="activo">Activo</option>
                <option value="pendiente">Pendiente</option>
              </select>
            </div>
            {(filtros.busqueda || filtros.rol || filtros.estado) && (
              <button
                type="button"
                className="btn btn-ghost btn-sm admin-filters__clear"
                onClick={() => {
                  setFiltros({ busqueda: '', rol: '', estado: '' });
                  setBusquedaInput('');
                }}
                aria-label="Limpiar todos los filtros"
              >
                Limpiar filtros
              </button>
            )}
          </div>

        {/* Tabla */}
        <div
          role="region"
          aria-label="Lista de usuarios"
          className="admin-table-wrap"
        >
          {loading ? (
            <div className="admin-loading" aria-live="polite" aria-busy="true">
              <LoadingSpinner />
              <p>Cargando usuarios…</p>
            </div>
          ) : usuarios.length === 0 ? (
            <p className="admin-empty" role="status">
              No se encontraron usuarios con los filtros aplicados.
            </p>
          ) : (
            <table className="admin-table" aria-label="Lista de usuarios">
              <thead>
                <tr>
                  <th scope="col">Usuario</th>
                  <th scope="col">Correo</th>
                  <th scope="col">Rol</th>
                  <th scope="col">Estado cuenta</th>
                  <th scope="col">Activo</th>
                  <th scope="col">Registro</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => {
                  const isLoading = actionLoading === u.id;
                  return (
                    <tr key={u.id} className={isLoading ? 'admin-table__row--loading' : ''}>
                      <td data-label="Usuario" className="admin-table__user">
                        <span className="admin-table__avatar" aria-hidden="true">
                          {u.nombre.charAt(0).toUpperCase()}
                        </span>
                        <span>
                          <strong>{u.nombre} {u.apellido}</strong>
                        </span>
                      </td>
                      <td data-label="Correo">
                        <a href={`mailto:${u.correo_electronico}`} className="admin-table__email">
                          {u.correo_electronico}
                        </a>
                      </td>
                      <td data-label="Rol">
                        <label htmlFor={`rol-${u.id}`} className="sr-only">
                          Rol de {u.nombre} {u.apellido}
                        </label>
                        <select
                          id={`rol-${u.id}`}
                          className="admin-table__rol-select"
                          value={u.rol}
                          disabled={isLoading}
                          onChange={(e) => solicitarCambioRol(u, e.target.value)}
                          aria-label={`Cambiar rol de ${u.nombre} ${u.apellido}`}
                        >
                          <option value="asistente">Asistente</option>
                          <option value="organizador">Organizador</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </td>
                      <td data-label="Estado cuenta">
                        <span className={`admin-badge admin-badge--estado-${u.estado_cuenta}`}>
                          {u.estado_cuenta}
                        </span>
                      </td>
                      <td data-label="Activo">
                        <label className="admin-switch" aria-label={`${u.activo ? 'Desactivar' : 'Activar'} cuenta de ${u.nombre} ${u.apellido}`}>
                          <input
                            type="checkbox"
                            className="admin-switch__input"
                            checked={u.activo}
                            disabled={isLoading}
                            onChange={() => solicitarCambioEstado(u)}
                            aria-checked={u.activo}
                          />
                          <span className="admin-switch__track" aria-hidden="true">
                            <span className="admin-switch__thumb" />
                          </span>
                          <span className="admin-switch__label">
                            {u.activo ? 'Activa' : 'Inactiva'}
                          </span>
                        </label>
                      </td>
                      <td data-label="Registro">
                        <time dateTime={u.creado_en}>
                          {new Date(u.creado_en).toLocaleDateString('es-EC', {
                            year: 'numeric', month: 'short', day: 'numeric',
                          })}
                        </time>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación */}
        {!loading && totalPaginas > 1 && (
          <nav className="admin-pagination" aria-label="Paginación de usuarios">
            <AccessibleTooltip content="Página anterior">
              <button
                type="button"
                className="admin-pagination__btn"
                onClick={() => irAPagina(paginacion.pagina - 1)}
                disabled={paginacion.pagina <= 1}
                aria-label="Página anterior"
              >
                ‹
              </button>
            </AccessibleTooltip>
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
            <AccessibleTooltip content="Página siguiente">
              <button
                type="button"
                className="admin-pagination__btn"
                onClick={() => irAPagina(paginacion.pagina + 1)}
                disabled={paginacion.pagina >= totalPaginas}
                aria-label="Página siguiente"
              >
                ›
              </button>
            </AccessibleTooltip>
          </nav>
        )}
      </div>

      {/* Modal de confirmación */}
      {confirmPayload && (
        <ConfirmModal
          payload={confirmPayload}
          onConfirm={ejecutarAccion}
          onCancel={() => setConfirmPayload(null)}
        />
      )}

      {/* Modal Crear Usuario */}
      {showCrearUsuario && (
        <div className="modal-overlay" role="presentation" onClick={() => setShowCrearUsuario(false)}>
          <div className="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="crear-usuario-title" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 id="crear-usuario-title" className="modal-title">Registrar Nuevo Usuario</h2>
            </div>
            <form onSubmit={handleCrearUsuario}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label htmlFor="crear-nombre" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Nombre</label>
                  <input id="crear-nombre" name="nombre" type="text" required className="admin-filters__input" style={{ width: '100%' }} />
                </div>
                <div>
                  <label htmlFor="crear-apellido" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Apellido</label>
                  <input id="crear-apellido" name="apellido" type="text" required className="admin-filters__input" style={{ width: '100%' }} />
                </div>
                <div>
                  <label htmlFor="crear-correo" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Correo electrónico</label>
                  <input id="crear-correo" name="correo" type="email" required className="admin-filters__input" style={{ width: '100%' }} />
                </div>
                <div>
                  <label htmlFor="crear-contrasena" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Contraseña</label>
                  <input id="crear-contrasena" name="contrasena" type="password" required minLength={6} className="admin-filters__input" style={{ width: '100%' }} />
                </div>
                <div>
                  <label htmlFor="crear-rol" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Rol inicial</label>
                  <select id="crear-rol" name="rol" className="admin-filters__select" style={{ width: '100%' }} defaultValue="organizador">
                    <option value="asistente">Asistente</option>
                    <option value="organizador">Organizador</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCrearUsuario(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
