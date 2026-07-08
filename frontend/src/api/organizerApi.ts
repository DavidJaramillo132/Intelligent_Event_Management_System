import { api } from './client';

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface EventoOrganizador {
  id: string;
  titulo: string;
  descripcion: string;
  inicio: string;
  fin: string;
  estado: string;
  capacidad: number;
  costo: number;
  imagen_portada?: string;
  tipo_evento?: { nombre: string };
  lugar?: { nombre: string; ciudad: string };
}

export interface EventoStats {
  checkins: number;
  inscripciones: number;
  capacidad: number;
  pct_ocupacion: number;
}

export interface Incidencia {
  id: string;
  evento_id: string;
  criticidad: 'informativa' | 'advertencia' | 'critica';
  descripcion: string;
  creado_en: string;
}

export interface MaterialEvento {
  id: string;
  evento_id: string;
  nombre: string;
  cantidad: number;
  estado: string;
  notas?: string;
}

export interface CheckinRecord {
  id: string;
  evento_id: string;
  inscripcion_id: string;
  boleto_id: string;
  ingreso_en: string;
  estado_acceso: string;
}

export interface PrediccionIA {
  id: number;
  evento_id: string;
  asistencia_predicha: number;
  porcentaje_ocupacion: number;
  confianza?: number;
  factores?: string;
  recomendaciones?: string;
  generado_en: string;
}

export interface AnalisisSatisfaccion {
  id: number;
  evento_id: string;
  puntaje_promedio?: number;
  resumen_sentimiento?: string;
  puntos_positivos?: string;
  puntos_mejora?: string;
  generado_en: string;
}

// ── API Functions ────────────────────────────────────────────────────────────

export const organizerApi = {
  // Mis eventos
  misEventos: (organizadorId: string) =>
    api.get<EventoOrganizador[]>(`/eventos/organizador/${organizadorId}`),

  // Stats de un evento
  stats: (eventoId: string) =>
    api.get<EventoStats>(`/eventos/${eventoId}/stats`),

  // Actualizar estado del evento (borrador/publicado)
  actualizarEvento: (eventoId: string, data: Partial<EventoOrganizador>) =>
    api.put<EventoOrganizador>(`/eventos/${eventoId}`, data),

  // Incidencias
  crearIncidencia: (data: { evento_id: string; criticidad: string; descripcion: string }) =>
    api.post<Incidencia>('/incidencias', data),

  listarIncidencias: (eventoId: string) =>
    api.get<Incidencia[]>(`/incidencias/evento/${eventoId}`),

  // Materiales
  crearMaterial: (data: { evento_id: string; nombre: string; cantidad: number; notas?: string }) =>
    api.post<MaterialEvento>('/materiales', data),

  listarMateriales: (eventoId: string) =>
    api.get<MaterialEvento[]>(`/materiales/evento/${eventoId}`),

  actualizarMaterial: (id: string, data: Partial<MaterialEvento>) =>
    api.put<MaterialEvento>(`/materiales/${id}`, data),

  eliminarMaterial: (id: string) =>
    api.delete(`/materiales/${id}`),

  // Check-ins
  registrarCheckin: (data: { evento_id: string; inscripcion_id: string; boleto_id: string; revisado_por?: string }) =>
    api.post<CheckinRecord>('/checkins', data),

  listarCheckins: (eventoId: string) =>
    api.get<CheckinRecord[]>(`/checkins/evento/${eventoId}`),

  // Inscripciones del evento
  listarInscripciones: (eventoId: string) =>
    api.get<unknown[]>(`/inscripciones/evento/${eventoId}`),

  // IA
  generarPrediccion: (data: { evento_id: string; notas?: string }) =>
    api.post<PrediccionIA>('/ia/predicciones', data),

  listarPredicciones: (eventoId: string) =>
    api.get<PrediccionIA[]>(`/ia/predicciones/evento/${eventoId}`),

  generarAnalisis: (data: { evento_id: string }) =>
    api.post<AnalisisSatisfaccion>('/ia/analisis', data),

  listarAnalisis: (eventoId: string) =>
    api.get<AnalisisSatisfaccion[]>(`/ia/analisis/evento/${eventoId}`),

  // Sesiones
  crearSesion: (eventoId: string, data: { titulo: string; inicio: string; fin: string; ponente?: string; orden?: number }) =>
    api.post(`/eventos/${eventoId}/sesiones`, data),

  listarSesiones: (eventoId: string) =>
    api.get(`/eventos/${eventoId}/sesiones`),

  eliminarSesion: (sesionId: string) =>
    api.delete(`/sesiones/${sesionId}`),

  // Tipos de entrada
  crearTipoEntrada: (eventoId: string, data: { nombre: string; precio: number; cupos_total: number }) =>
    api.post(`/eventos/${eventoId}/tipos-entrada`, data),

  listarTiposEntrada: (eventoId: string) =>
    api.get(`/eventos/${eventoId}/tipos-entrada`),
};
