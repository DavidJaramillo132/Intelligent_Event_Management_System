package ia

// ── DTOs para el paquete ia (predicciones + análisis de satisfacción) ────────

// ── Predicciones ────────────────────────────────────────────────────────────

type EventoPrevioInput struct {
	Titulo     string `json:"titulo"`
	Asistentes int    `json:"asistentes"`
	Capacidad  int    `json:"capacidad"`
}

// CrearPrediccionInput recibe los datos del evento para enviar al microservicio de IA.
type CrearPrediccionInput struct {
	EventoID       string              `json:"evento_id"`
	Titulo         string              `json:"titulo"`
	TipoEvento     string              `json:"tipo_evento"`
	Capacidad      int                 `json:"capacidad"`
	Costo          float64             `json:"costo"`
	FechaInicio    string              `json:"fecha_inicio"`
	Lugar          string              `json:"lugar"`
	Ciudad         string              `json:"ciudad"`
	EventosPrevios []EventoPrevioInput `json:"eventos_previos"`
}

type PrediccionResponse struct {
	ID                  int64    `json:"id"`
	EventoID            string   `json:"evento_id"`
	AsistenciaPredicha  int      `json:"asistencia_predicha"`
	PorcentajeOcupacion float64  `json:"porcentaje_ocupacion"`
	Confianza           *float64 `json:"confianza,omitempty"`
	Factores            string   `json:"factores,omitempty"`
	Recomendaciones     string   `json:"recomendaciones,omitempty"`
	VersionModelo       string   `json:"version_modelo,omitempty"`
	GeneradoEn          string   `json:"generado_en"`
	Notas               string   `json:"notas,omitempty"`
}

// ── Análisis de satisfacción ────────────────────────────────────────────────

type RespuestaEncuestaInput struct {
	Pregunta  string   `json:"pregunta"`
	Respuesta string   `json:"respuesta"`
	Puntaje   *float64 `json:"puntaje,omitempty"`
}

// CrearAnalisisInput recibe los datos de la encuesta para enviar al microservicio de IA.
type CrearAnalisisInput struct {
	EventoID        string                   `json:"evento_id"`
	Titulo          string                   `json:"titulo"`
	TipoEvento      string                   `json:"tipo_evento"`
	TotalAsistentes int                      `json:"total_asistentes"`
	TotalRespuestas int                      `json:"total_respuestas"`
	Respuestas      []RespuestaEncuestaInput `json:"respuestas"`
}

type AnalisisResponse struct {
	ID                 int64    `json:"id"`
	EventoID           string   `json:"evento_id"`
	PuntajePromedio    *float64 `json:"puntaje_promedio,omitempty"`
	ResumenSentimiento string   `json:"resumen_sentimiento,omitempty"`
	PuntosPositivos    string   `json:"puntos_positivos,omitempty"`
	PuntosMejora       string   `json:"puntos_mejora,omitempty"`
	GeneradoEn         string   `json:"generado_en"`
}

// ── Análisis de público ─────────────────────────────────────────────────────

type AsistenteInfoInput struct {
	Nombre    string `json:"nombre"`
	Ciudad    string `json:"ciudad"`
	Provincia string `json:"provincia"`
	Pais      string `json:"pais"`
}

// CrearPublicoInput recibe datos del evento y sus asistentes para análisis de público.
type CrearPublicoInput struct {
	EventoID   string               `json:"evento_id"`
	Titulo     string               `json:"titulo"`
	TipoEvento string               `json:"tipo_evento"`
	Asistentes []AsistenteInfoInput `json:"asistentes"`
}

type SegmentoResponse struct {
	Nombre      string  `json:"nombre"`
	Porcentaje  float64 `json:"porcentaje"`
	Descripcion string  `json:"descripcion"`
}

type DistribucionGeoResponse struct {
	CiudadPrincipal         string  `json:"ciudad_principal"`
	ConcentracionPorcentaje float64 `json:"concentracion_porcentaje"`
	Diversidad              string  `json:"diversidad"`
}

type PublicoResponse struct {
	ID                       int64                   `json:"id"`
	EventoID                 string                  `json:"evento_id"`
	TotalAnalizado           int                     `json:"total_analizado"`
	Segmentos                string                  `json:"segmentos"`
	DistribucionGeografica   string                  `json:"distribucion_geografica"`
	PerfilPredominante       string                  `json:"perfil_predominante"`
	Insights                 string                  `json:"insights"`
	RecomendacionesMarketing string                  `json:"recomendaciones_marketing"`
	GeneradoEn               string                  `json:"generado_en"`
}
