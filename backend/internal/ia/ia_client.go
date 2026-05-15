package ia

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

// ── Structs de request/response hacia el microservicio Python ────────────────

type IAEventoPrevio struct {
	Titulo     string `json:"titulo"`
	Asistentes int    `json:"asistentes"`
	Capacidad  int    `json:"capacidad"`
}

type IAPrediccionRequest struct {
	EventoID       string           `json:"evento_id"`
	Titulo         string           `json:"titulo"`
	TipoEvento     string           `json:"tipo_evento"`
	Capacidad      int              `json:"capacidad"`
	Costo          float64          `json:"costo"`
	FechaInicio    string           `json:"fecha_inicio"`
	Lugar          string           `json:"lugar"`
	Ciudad         string           `json:"ciudad"`
	EventosPrevios []IAEventoPrevio `json:"eventos_previos"`
}

type IAPrediccionResponse struct {
	EventoID            string   `json:"evento_id"`
	AsistenciaPredicha  int      `json:"asistencia_predicha"`
	PorcentajeOcupacion float64  `json:"porcentaje_ocupacion"`
	Confianza           float64  `json:"confianza"`
	Factores            []string `json:"factores"`
	Recomendaciones     []string `json:"recomendaciones"`
}

type IARespuestaEncuesta struct {
	Pregunta  string   `json:"pregunta"`
	Respuesta string   `json:"respuesta"`
	Puntaje   *float64 `json:"puntaje,omitempty"`
}

type IAAnalisisRequest struct {
	EventoID        string                `json:"evento_id"`
	Titulo          string                `json:"titulo"`
	TipoEvento      string                `json:"tipo_evento"`
	TotalAsistentes int                   `json:"total_asistentes"`
	TotalRespuestas int                   `json:"total_respuestas"`
	Respuestas      []IARespuestaEncuesta `json:"respuestas"`
}

type IAAnalisisPorPregunta struct {
	Pregunta    string `json:"pregunta"`
	Conclusion  string `json:"conclusion"`
	Sentimiento string `json:"sentimiento"`
}

type IAAnalisisResponse struct {
	EventoID            string                  `json:"evento_id"`
	PuntajePromedio     float64                 `json:"puntaje_promedio"`
	SentimientoGeneral  string                  `json:"sentimiento_general"`
	Resumen             string                  `json:"resumen"`
	PuntosPositivos     []string                `json:"puntos_positivos"`
	PuntosMejora        []string                `json:"puntos_mejora"`
	TasaRespuesta       float64                 `json:"tasa_respuesta"`
	AnalisisPorPregunta []IAAnalisisPorPregunta  `json:"analisis_por_pregunta"`
}

// ── Cliente HTTP ─────────────────────────────────────────────────────────────

// IAClient es el cliente HTTP para comunicarse con el microservicio de IA (Python/FastAPI).
type IAClient struct {
	baseURL    string
	httpClient *http.Client
}

// NewIAClient crea una nueva instancia del cliente de IA.
func NewIAClient() *IAClient {
	baseURL := os.Getenv("IA_SERVICE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:8000"
	}
	return &IAClient{
		baseURL:    baseURL,
		httpClient: &http.Client{Timeout: 60 * time.Second},
	}
}

// PredecirAsistencia llama al endpoint /ia/prediccion/ del microservicio.
func (c *IAClient) PredecirAsistencia(input IAPrediccionRequest) (*IAPrediccionResponse, error) {
	body, err := json.Marshal(input)
	if err != nil {
		return nil, fmt.Errorf("error serializando request: %w", err)
	}

	resp, err := c.httpClient.Post(
		fmt.Sprintf("%s/ia/prediccion/", c.baseURL),
		"application/json",
		bytes.NewReader(body),
	)
	if err != nil {
		return nil, fmt.Errorf("error conectando con el servicio de IA: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("ia-service respondió con status %d: %s", resp.StatusCode, string(respBody))
	}

	var result IAPrediccionResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("error decodificando respuesta de IA: %w", err)
	}
	return &result, nil
}

// AnalizarSatisfaccion llama al endpoint /ia/satisfaccion/ del microservicio.
func (c *IAClient) AnalizarSatisfaccion(input IAAnalisisRequest) (*IAAnalisisResponse, error) {
	body, err := json.Marshal(input)
	if err != nil {
		return nil, fmt.Errorf("error serializando request: %w", err)
	}

	resp, err := c.httpClient.Post(
		fmt.Sprintf("%s/ia/satisfaccion/", c.baseURL),
		"application/json",
		bytes.NewReader(body),
	)
	if err != nil {
		return nil, fmt.Errorf("error conectando con el servicio de IA: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("ia-service respondió con status %d: %s", resp.StatusCode, string(respBody))
	}

	var result IAAnalisisResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("error decodificando respuesta de IA: %w", err)
	}
	return &result, nil
}

// ── Análisis de público ─────────────────────────────────────────────────────

type IAAsistenteInfo struct {
	Nombre    string `json:"nombre"`
	Ciudad    string `json:"ciudad"`
	Provincia string `json:"provincia"`
	Pais      string `json:"pais"`
}

type IAPublicoRequest struct {
	EventoID   string            `json:"evento_id"`
	Titulo     string            `json:"titulo"`
	TipoEvento string            `json:"tipo_evento"`
	Asistentes []IAAsistenteInfo `json:"asistentes"`
}

type IASegmento struct {
	Nombre      string  `json:"nombre"`
	Porcentaje  float64 `json:"porcentaje"`
	Descripcion string  `json:"descripcion"`
}

type IADistribucionGeo struct {
	CiudadPrincipal         string  `json:"ciudad_principal"`
	ConcentracionPorcentaje float64 `json:"concentracion_porcentaje"`
	Diversidad              string  `json:"diversidad"`
}

type IAPublicoResponse struct {
	EventoID                 string            `json:"evento_id"`
	TotalAnalizado           int               `json:"total_analizado"`
	Segmentos                []IASegmento      `json:"segmentos"`
	DistribucionGeografica   IADistribucionGeo `json:"distribucion_geografica"`
	PerfilPredominante       string            `json:"perfil_predominante"`
	Insights                 []string          `json:"insights"`
	RecomendacionesMarketing []string          `json:"recomendaciones_marketing"`
}

// AnalizarPublico llama al endpoint /ia/publico/ del microservicio.
func (c *IAClient) AnalizarPublico(input IAPublicoRequest) (*IAPublicoResponse, error) {
	body, err := json.Marshal(input)
	if err != nil {
		return nil, fmt.Errorf("error serializando request: %w", err)
	}

	resp, err := c.httpClient.Post(
		fmt.Sprintf("%s/ia/publico/", c.baseURL),
		"application/json",
		bytes.NewReader(body),
	)
	if err != nil {
		return nil, fmt.Errorf("error conectando con el servicio de IA: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("ia-service respondió con status %d: %s", resp.StatusCode, string(respBody))
	}

	var result IAPublicoResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("error decodificando respuesta de IA: %w", err)
	}
	return &result, nil
}
