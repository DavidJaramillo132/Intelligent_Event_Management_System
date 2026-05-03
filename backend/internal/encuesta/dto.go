package encuesta

// ── DTOs para el paquete encuesta ───────────────────────────────────────────

// ── Encuesta ────────────────────────────────────────────────────────────────

type CrearEncuestaInput struct {
	EventoID    string                  `json:"evento_id"`
	Titulo      string                  `json:"titulo"`
	Descripcion string                  `json:"descripcion"`
	Preguntas   []CrearPreguntaInput    `json:"preguntas,omitempty"`
}

type ActualizarEncuestaInput struct {
	Titulo      *string `json:"titulo,omitempty"`
	Descripcion *string `json:"descripcion,omitempty"`
	Activo      *bool   `json:"activo,omitempty"`
}

type EncuestaResponse struct {
	ID            int64               `json:"id"`
	EventoID      string              `json:"evento_id"`
	Titulo        string              `json:"titulo"`
	Descripcion   string              `json:"descripcion,omitempty"`
	Activo        bool                `json:"activo"`
	CreadoEn      string              `json:"creado_en"`
	ActualizadoEn string              `json:"actualizado_en"`
	Preguntas     []PreguntaResponse  `json:"preguntas,omitempty"`
}

// ── Pregunta ────────────────────────────────────────────────────────────────

type CrearPreguntaInput struct {
	TextoPregunta string `json:"texto_pregunta"`
	TipoPregunta  string `json:"tipo_pregunta"` // escala | texto | opcion_multiple
	Requerido     bool   `json:"requerido"`
	Opciones      string `json:"opciones"`
	Orden         int    `json:"orden"`
}

type ActualizarPreguntaInput struct {
	TextoPregunta *string `json:"texto_pregunta,omitempty"`
	TipoPregunta  *string `json:"tipo_pregunta,omitempty"`
	Requerido     *bool   `json:"requerido,omitempty"`
	Opciones      *string `json:"opciones,omitempty"`
	Orden         *int    `json:"orden,omitempty"`
}

type PreguntaResponse struct {
	ID            int64  `json:"id"`
	EncuestaID    int64  `json:"encuesta_id"`
	TextoPregunta string `json:"texto_pregunta"`
	TipoPregunta  string `json:"tipo_pregunta"`
	Requerido     bool   `json:"requerido"`
	Opciones      string `json:"opciones,omitempty"`
	Orden         int    `json:"orden"`
	CreadoEn      string `json:"creado_en"`
}

// ── Respuesta ───────────────────────────────────────────────────────────────

type EnviarRespuestaInput struct {
	EncuestaID    int64                       `json:"encuesta_id"`
	InscripcionID *string                     `json:"inscripcion_id,omitempty"`
	Respuestas    []RespuestaPreguntaInput    `json:"respuestas"`
}

type RespuestaPreguntaInput struct {
	PreguntaID      int64    `json:"pregunta_id"`
	Respuesta       string   `json:"respuesta"`
	PuntajeNumerico *float64 `json:"puntaje_numerico,omitempty"`
}

type RespuestaEncuestaResponse struct {
	ID            int64                          `json:"id"`
	EncuestaID    int64                          `json:"encuesta_id"`
	InscripcionID *string                        `json:"inscripcion_id,omitempty"`
	EnviadoEn     string                         `json:"enviado_en"`
	Respuestas    []RespuestaPreguntaResponse    `json:"respuestas,omitempty"`
}

type RespuestaPreguntaResponse struct {
	ID              int64    `json:"id"`
	PreguntaID      int64    `json:"pregunta_id"`
	Respuesta       string   `json:"respuesta,omitempty"`
	PuntajeNumerico *float64 `json:"puntaje_numerico,omitempty"`
	CreadoEn        string   `json:"creado_en"`
}
