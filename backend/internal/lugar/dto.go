package lugar

// ── DTOs para el paquete lugar ──────────────────────────────────────────────

type CrearLugarInput struct {
	Nombre      string `json:"nombre"`
	Direccion   string `json:"direccion"`
	Ciudad      string `json:"ciudad"`
	Provincia   string `json:"provincia"`
	Pais        string `json:"pais"`
	Capacidad   int    `json:"capacidad"`
	Descripcion string `json:"descripcion"`
}

type ActualizarLugarInput struct {
	Nombre      *string `json:"nombre,omitempty"`
	Direccion   *string `json:"direccion,omitempty"`
	Ciudad      *string `json:"ciudad,omitempty"`
	Provincia   *string `json:"provincia,omitempty"`
	Pais        *string `json:"pais,omitempty"`
	Capacidad   *int    `json:"capacidad,omitempty"`
	Descripcion *string `json:"descripcion,omitempty"`
}

type LugarResponse struct {
	ID            string `json:"id"`
	Nombre        string `json:"nombre"`
	Direccion     string `json:"direccion"`
	Ciudad        string `json:"ciudad"`
	Provincia     string `json:"provincia,omitempty"`
	Pais          string `json:"pais"`
	Capacidad     int    `json:"capacidad"`
	Descripcion   string `json:"descripcion,omitempty"`
	CreadoEn      string `json:"creado_en"`
	ActualizadoEn string `json:"actualizado_en"`
}
