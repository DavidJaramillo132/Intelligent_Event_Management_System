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
	ImagenPortada  string     `json:"imagen_portada,omitempty"`
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
	ImagenPortada  *string    `json:"imagen_portada,omitempty"`
}

type EventoResponse struct {
	ID              string   `json:"id"`
	OrganizadorID   string   `json:"organizador_id"`
	TipoEventoID    int64    `json:"tipo_evento_id"`
	TipoEventoNombre string  `json:"tipo_evento_nombre,omitempty"`
	LugarID         *string  `json:"lugar_id,omitempty"`
	LugarNombre     string   `json:"lugar_nombre,omitempty"`
	LugarDireccion  string   `json:"lugar_direccion,omitempty"`
	LugarCiudad     string   `json:"lugar_ciudad,omitempty"`
	AccesibilidadFisica    bool `json:"accesibilidad_fisica"`
	AccesibilidadSensorial bool `json:"accesibilidad_sensorial"`
	Titulo          string   `json:"titulo"`
	Descripcion     string   `json:"descripcion,omitempty"`
	Inicio          string   `json:"inicio"`
	Fin             string   `json:"fin"`
	Capacidad       int      `json:"capacidad"`
	InicioRegistro  *string  `json:"inicio_registro,omitempty"`
	FinRegistro     *string  `json:"fin_registro,omitempty"`
	Costo           float64  `json:"costo"`
	Estado          string   `json:"estado"`
	ImagenPortada   string   `json:"imagen_portada,omitempty"`
	CreadoEn        string   `json:"creado_en"`
	ActualizadoEn   string   `json:"actualizado_en"`
}

// FiltrosEvento — query params para búsqueda pública
type FiltrosEvento struct {
	Q                      string
	TipoEventoID           string
	FechaInicio            string
	FechaFin               string
	CostoMin               string
	CostoMax               string
	SoloAccesibles         bool
}
