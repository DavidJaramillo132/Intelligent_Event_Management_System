package evento

import "time"

// ── DTOs para el paquete evento ─────────────────────────────────────────────

type CrearEventoInput struct {
	OrganizadorID  string     `json:"organizador_id"`
	TipoEventoID   int64      `json:"tipo_evento_id"`
	LugarID        *string    `json:"lugar_id,omitempty"`
	Titulo         string     `json:"titulo"`
	Descripcion    string     `json:"descripcion"`
	Inicio         time.Time  `json:"inicio"`
	Fin            time.Time  `json:"fin"`
	Capacidad      int        `json:"capacidad"`
	InicioRegistro *time.Time `json:"inicio_registro,omitempty"`
	FinRegistro    *time.Time `json:"fin_registro,omitempty"`
	Costo          float64    `json:"costo"`
}

type ActualizarEventoInput struct {
	TipoEventoID   *int64     `json:"tipo_evento_id,omitempty"`
	LugarID        *string    `json:"lugar_id,omitempty"`
	Titulo         *string    `json:"titulo,omitempty"`
	Descripcion    *string    `json:"descripcion,omitempty"`
	Inicio         *time.Time `json:"inicio,omitempty"`
	Fin            *time.Time `json:"fin,omitempty"`
	Capacidad      *int       `json:"capacidad,omitempty"`
	InicioRegistro *time.Time `json:"inicio_registro,omitempty"`
	FinRegistro    *time.Time `json:"fin_registro,omitempty"`
	Costo          *float64   `json:"costo,omitempty"`
	Estado         *string    `json:"estado,omitempty"`
}

type EventoResponse struct {
	ID              string  `json:"id"`
	OrganizadorID   string  `json:"organizador_id"`
	TipoEventoID    int64   `json:"tipo_evento_id"`
	LugarID         *string `json:"lugar_id,omitempty"`
	Titulo          string  `json:"titulo"`
	Descripcion     string  `json:"descripcion,omitempty"`
	Inicio          string  `json:"inicio"`
	Fin             string  `json:"fin"`
	Capacidad       int     `json:"capacidad"`
	InicioRegistro  *string `json:"inicio_registro,omitempty"`
	FinRegistro     *string `json:"fin_registro,omitempty"`
	Costo           float64 `json:"costo"`
	Estado          string  `json:"estado"`
	CreadoEn        string  `json:"creado_en"`
	ActualizadoEn   string  `json:"actualizado_en"`
}
