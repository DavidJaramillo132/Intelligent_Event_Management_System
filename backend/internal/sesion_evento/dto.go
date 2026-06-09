package sesion_evento

import "time"

type CrearSesionInput struct {
	Titulo      string    `json:"titulo"`
	Descripcion string    `json:"descripcion,omitempty"`
	Inicio      time.Time `json:"inicio"`
	Fin         time.Time `json:"fin"`
	Ponente     string    `json:"ponente,omitempty"`
	Orden       int       `json:"orden"`
}

type SesionResponse struct {
	ID          string `json:"id"`
	EventoID    string `json:"evento_id"`
	Titulo      string `json:"titulo"`
	Descripcion string `json:"descripcion,omitempty"`
	Inicio      string `json:"inicio"`
	Fin         string `json:"fin"`
	Ponente     string `json:"ponente,omitempty"`
	Orden       int    `json:"orden"`
}
