package checkin

// ── DTOs para el paquete checkin (materiales + registros de ingreso) ─────────

// ── MaterialEvento DTOs ─────────────────────────────────────────────────────

type CrearMaterialInput struct {
	EventoID string `json:"evento_id"`
	Nombre   string `json:"nombre"`
	Cantidad int    `json:"cantidad"`
	Notas    string `json:"notas"`
}

type ActualizarMaterialInput struct {
	Nombre   *string `json:"nombre,omitempty"`
	Cantidad *int    `json:"cantidad,omitempty"`
	Estado   *string `json:"estado,omitempty"` // pendiente | asignado | entregado
	Notas    *string `json:"notas,omitempty"`
}

type MaterialResponse struct {
	ID            string `json:"id"`
	EventoID      string `json:"evento_id"`
	Nombre        string `json:"nombre"`
	Cantidad      int    `json:"cantidad"`
	Estado        string `json:"estado"`
	Notas         string `json:"notas,omitempty"`
	CreadoEn      string `json:"creado_en"`
	ActualizadoEn string `json:"actualizado_en"`
}

// ── RegistroCheckin DTOs ────────────────────────────────────────────────────

type CrearCheckinInput struct {
	EventoID      string  `json:"evento_id"`
	InscripcionID string  `json:"inscripcion_id"`
	BoletoID      string  `json:"boleto_id"`
	RevisadoPor   *string `json:"revisado_por,omitempty"`
	Notas         string  `json:"notas"`
}

type CheckinResponse struct {
	ID            string  `json:"id"`
	EventoID      string  `json:"evento_id"`
	InscripcionID string  `json:"inscripcion_id"`
	BoletoID      string  `json:"boleto_id"`
	RevisadoPor   *string `json:"revisado_por,omitempty"`
	IngresoEn     string  `json:"ingreso_en"`
	EstadoAcceso  string  `json:"estado_acceso"`
	Notas         string  `json:"notas,omitempty"`
}
