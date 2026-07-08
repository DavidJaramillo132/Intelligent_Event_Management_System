package incidencia

// ── DTOs para el paquete incidencia ─────────────────────────────────────────

type CrearIncidenciaInput struct {
	EventoID    string `json:"evento_id"`
	Criticidad  string `json:"criticidad"` // informativa | advertencia | critica
	Descripcion string `json:"descripcion"`
}

type IncidenciaResponse struct {
	ID          string `json:"id"`
	EventoID    string `json:"evento_id"`
	Criticidad  string `json:"criticidad"`
	Descripcion string `json:"descripcion"`
	CreadoEn    string `json:"creado_en"`
}
