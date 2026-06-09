import { apiRequest } from './client';

export interface UsuarioAdmin {
  id: string;
  nombre: string;
  apellido: string;
  correo_electronico: string;
  rol: 'asistente' | 'organizador' | 'admin';
  activo: boolean;
  estado_cuenta: 'activo' | 'pendiente' | 'suspendido';
  creado_en: string;
}

export interface PaginatedUsuarios {
  data: UsuarioAdmin[];
  total: number;
  pagina: number;
  limite: number;
}

export interface LogAuditoria {
  id: number;
  usuario_id?: string;
  correo_usuario: string;
  ip_address: string;
  accion: string;
  descripcion: string;
  creado_en: string;
}

export interface PaginatedLogs {
  data: LogAuditoria[];
  total: number;
  pagina: number;
  limite: number;
}

export interface FiltrosUsuarios {
  pagina?: number;
  limite?: number;
  rol?: string;
  busqueda?: string;
  estado?: string;
}

export interface FiltrosAuditoria {
  pagina?: number;
  limite?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  usuario?: string;
  tipo_accion?: string;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== '') {
      q.append(key, String(val));
    }
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const adminApi = {
  listarUsuarios: (filtros: FiltrosUsuarios = {}) =>
    apiRequest<PaginatedUsuarios>(
      `/admin/usuarios${buildQuery(filtros as Record<string, string | number>)}`
    ),

  listarPendientes: () =>
    apiRequest<PaginatedUsuarios>('/admin/usuarios/pendientes'),

  actualizarRol: (id: string, rol: string) =>
    apiRequest<void>(`/admin/usuarios/${id}/rol`, { method: 'PATCH', body: { rol } }),

  actualizarEstado: (id: string, activo: boolean) =>
    apiRequest<void>(`/admin/usuarios/${id}/estado`, { method: 'PATCH', body: { activo } }),

  aprobarOrganizador: (id: string) =>
    apiRequest<void>(`/admin/usuarios/${id}/aprobar`, { method: 'POST' }),

  listarLogs: (filtros: FiltrosAuditoria = {}) =>
    apiRequest<PaginatedLogs>(
      `/admin/auditoria${buildQuery(filtros as Record<string, string | number>)}`
    ),
};
