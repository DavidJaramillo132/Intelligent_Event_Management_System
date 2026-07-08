package tipo_entrada

// ── DTOs para tipos de entrada ──────────────────────────────────────────────

type CrearTipoEntradaInput struct {
	Nombre      string  `json:"nombre"`
	Precio      float64 `json:"precio"`
	CuposTotal  int     `json:"cupos_total"`
	Descripcion string  `json:"descripcion,omitempty"`
}

type TipoEntradaResponse struct {
	ID          string  `json:"id"`
	EventoID    string  `json:"evento_id"`
	Nombre      string  `json:"nombre"`
	Precio      float64 `json:"precio"`
	CuposTotal  int     `json:"cupos_total"`
	CuposUsados int     `json:"cupos_usados"`
	Disponible  bool    `json:"disponible"`
	Descripcion string  `json:"descripcion,omitempty"`
}

type DisponibilidadResponse struct {
	CapacidadTotal    int                    `json:"capacidad_total"`
	Inscritos         int                    `json:"inscritos"`
	CuposDisponibles  int                    `json:"cupos_disponibles"`
	TiposEntrada      []TipoEntradaResponse  `json:"tipos_entrada"`
}
