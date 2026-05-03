package tipo_evento

// ── DTOs para el paquete tipo_evento ────────────────────────────────────────

type CrearTipoEventoInput struct {
	Nombre      string `json:"nombre"`
	Descripcion string `json:"descripcion"`
}

type ActualizarTipoEventoInput struct {
	Nombre      *string `json:"nombre,omitempty"`
	Descripcion *string `json:"descripcion,omitempty"`
}

type TipoEventoResponse struct {
	ID          int64  `json:"id"`
	Nombre      string `json:"nombre"`
	Descripcion string `json:"descripcion,omitempty"`
	CreadoEn    string `json:"creado_en"`
}
