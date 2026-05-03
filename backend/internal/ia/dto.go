package ia

// ── DTOs para el paquete ia (predicciones + análisis de satisfacción) ────────

type CrearPrediccionInput struct {
	EventoID           string   `json:"evento_id"`
	AsistenciaPredicha int      `json:"asistencia_predicha"`
	Confianza          *float64 `json:"confianza,omitempty"`
	VersionModelo      string   `json:"version_modelo"`
	Notas              string   `json:"notas"`
}

type PrediccionResponse struct {
	ID                 int64    `json:"id"`
	EventoID           string   `json:"evento_id"`
	AsistenciaPredicha int      `json:"asistencia_predicha"`
	Confianza          *float64 `json:"confianza,omitempty"`
	VersionModelo      string   `json:"version_modelo,omitempty"`
	GeneradoEn         string   `json:"generado_en"`
	Notas              string   `json:"notas,omitempty"`
}

type CrearAnalisisInput struct {
	EventoID           string   `json:"evento_id"`
	PuntajePromedio    *float64 `json:"puntaje_promedio,omitempty"`
	ResumenSentimiento string   `json:"resumen_sentimiento"`
	PuntosPositivos    string   `json:"puntos_positivos"`
	PuntosMejora       string   `json:"puntos_mejora"`
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
