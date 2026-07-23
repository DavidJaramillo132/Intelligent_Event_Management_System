package ia

import (
	"encoding/json"
	"log"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"main.go/models"
)

type Service struct {
	repo     *Repository
	iaClient *IAClient
}

func NewService(repo *Repository, iaClient *IAClient) *Service {
	return &Service{repo: repo, iaClient: iaClient}
}

// ── Predicciones ────────────────────────────────────────────────────────────

func (s *Service) CrearPrediccion(input CrearPrediccionInput) (*PrediccionResponse, error) {
	if input.EventoID == "" || input.Titulo == "" {
		return nil, fiber.NewError(fiber.StatusBadRequest, "evento_id y titulo son requeridos")
	}
	eventoUUID, err := uuid.Parse(input.EventoID)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusBadRequest, "evento_id inválido")
	}

	// ── Llamar al microservicio de IA ────────────────────────────────────
	var previos []IAEventoPrevio
	for _, ep := range input.EventosPrevios {
		previos = append(previos, IAEventoPrevio{
			Titulo: ep.Titulo, Asistentes: ep.Asistentes, Capacidad: ep.Capacidad,
		})
	}

	iaReq := IAPrediccionRequest{
		EventoID:       input.EventoID,
		Titulo:         input.Titulo,
		TipoEvento:     input.TipoEvento,
		Capacidad:      input.Capacidad,
		Costo:          input.Costo,
		FechaInicio:    input.FechaInicio,
		Lugar:          input.Lugar,
		Ciudad:         input.Ciudad,
		EventosPrevios: previos,
	}

	iaResp, err := s.iaClient.PredecirAsistencia(iaReq)
	if err != nil {
		log.Printf("❌ Error llamando al servicio de IA: %v", err)
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error al generar la predicción con IA")
	}

	// ── Serializar arrays como JSON para almacenar en BD ────────────────
	factoresJSON, _ := json.Marshal(iaResp.Factores)
	recomendacionesJSON, _ := json.Marshal(iaResp.Recomendaciones)
	confianza := iaResp.Confianza

	// ── Persistir en la base de datos ───────────────────────────────────
	p := &models.PrediccionAsistencia{
		EventoID:            eventoUUID,
		AsistenciaPredicha:  iaResp.AsistenciaPredicha,
		PorcentajeOcupacion: iaResp.PorcentajeOcupacion,
		Confianza:           &confianza,
		Factores:            string(factoresJSON),
		Recomendaciones:     string(recomendacionesJSON),
		VersionModelo:       "gemini-2.0-flash-lite",
	}

	if err := s.repo.CrearPrediccion(p); err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error guardando la predicción")
	}

	return toPrediccionResponse(*p), nil
}

func (s *Service) ObtenerPrediccionPorID(id int64) (*PrediccionResponse, error) {
	p, err := s.repo.BuscarPrediccionPorID(id)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusNotFound, "Predicción no encontrada")
	}
	return toPrediccionResponse(*p), nil
}

func (s *Service) ListarPrediccionesPorEvento(eventoID string) ([]PrediccionResponse, error) {
	preds, err := s.repo.ListarPrediccionesPorEvento(eventoID)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error listando predicciones")
	}
	var resp []PrediccionResponse
	for _, p := range preds {
		resp = append(resp, *toPrediccionResponse(p))
	}
	return resp, nil
}

// ── Análisis satisfacción ───────────────────────────────────────────────────

func (s *Service) CrearAnalisis(input CrearAnalisisInput) (*AnalisisResponse, error) {
	if input.EventoID == "" {
		return nil, fiber.NewError(fiber.StatusBadRequest, "evento_id es requerido")
	}
	eventoUUID, err := uuid.Parse(input.EventoID)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusBadRequest, "evento_id inválido")
	}

	// ── Llamar al microservicio de IA ────────────────────────────────────
	var respuestas []IARespuestaEncuesta
	for _, r := range input.Respuestas {
		respuestas = append(respuestas, IARespuestaEncuesta{
			Pregunta: r.Pregunta, Respuesta: r.Respuesta, Puntaje: r.Puntaje,
		})
	}

	iaReq := IAAnalisisRequest{
		EventoID:        input.EventoID,
		Titulo:          input.Titulo,
		TipoEvento:      input.TipoEvento,
		TotalAsistentes: input.TotalAsistentes,
		TotalRespuestas: input.TotalRespuestas,
		Respuestas:      respuestas,
	}

	iaResp, err := s.iaClient.AnalizarSatisfaccion(iaReq)
	if err != nil {
		log.Printf("❌ Error llamando al servicio de IA: %v", err)
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error al generar el análisis con IA")
	}

	// ── Construir resumen para almacenar ────────────────────────────────
	resumenSentimiento := iaResp.SentimientoGeneral + ": " + iaResp.Resumen
	puntaje := iaResp.PuntajePromedio

	a := &models.AnalisisSatisfaccion{
		EventoID:           eventoUUID,
		PuntajePromedio:    &puntaje,
		ResumenSentimiento: resumenSentimiento,
		PuntosPositivos:    strings.Join(iaResp.PuntosPositivos, " | "),
		PuntosMejora:       strings.Join(iaResp.PuntosMejora, " | "),
	}

	if err := s.repo.CrearAnalisis(a); err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error guardando el análisis")
	}

	return toAnalisisResponse(*a), nil
}

func (s *Service) ObtenerAnalisisPorID(id int64) (*AnalisisResponse, error) {
	a, err := s.repo.BuscarAnalisisPorID(id)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusNotFound, "Análisis no encontrado")
	}
	return toAnalisisResponse(*a), nil
}

func (s *Service) ListarAnalisisPorEvento(eventoID string) ([]AnalisisResponse, error) {
	analisis, err := s.repo.ListarAnalisisPorEvento(eventoID)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error listando análisis")
	}
	var resp []AnalisisResponse
	for _, a := range analisis {
		resp = append(resp, *toAnalisisResponse(a))
	}
	return resp, nil
}

// ── HELPERS ──────────────────────────────────────────────────────────────────

func toPrediccionResponse(p models.PrediccionAsistencia) *PrediccionResponse {
	return &PrediccionResponse{
		ID:                  p.ID,
		EventoID:            p.EventoID.String(),
		AsistenciaPredicha:  p.AsistenciaPredicha,
		PorcentajeOcupacion: p.PorcentajeOcupacion,
		Confianza:           p.Confianza,
		Factores:            p.Factores,
		Recomendaciones:     p.Recomendaciones,
		VersionModelo:       p.VersionModelo,
		GeneradoEn:          p.GeneradoEn.Format("2006-01-02T15:04:05Z07:00"),
		Notas:               p.Notas,
	}
}

func toAnalisisResponse(a models.AnalisisSatisfaccion) *AnalisisResponse {
	return &AnalisisResponse{
		ID:                 a.ID,
		EventoID:           a.EventoID.String(),
		PuntajePromedio:    a.PuntajePromedio,
		ResumenSentimiento: a.ResumenSentimiento,
		PuntosPositivos:    a.PuntosPositivos,
		PuntosMejora:       a.PuntosMejora,
		GeneradoEn:         a.GeneradoEn.Format("2006-01-02T15:04:05Z07:00"),
	}
}

// ── Análisis de público ─────────────────────────────────────────────────────

func (s *Service) CrearPublico(input CrearPublicoInput) (*PublicoResponse, error) {
	if input.EventoID == "" || len(input.Asistentes) == 0 {
		return nil, fiber.NewError(fiber.StatusBadRequest, "evento_id y asistentes son requeridos")
	}
	eventoUUID, err := uuid.Parse(input.EventoID)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusBadRequest, "evento_id inválido")
	}

	// ── Llamar al microservicio de IA ────────────────────────────────────
	var asistentes []IAAsistenteInfo
	for _, a := range input.Asistentes {
		asistentes = append(asistentes, IAAsistenteInfo{
			Nombre: a.Nombre, Ciudad: a.Ciudad, Provincia: a.Provincia, Pais: a.Pais,
		})
	}

	iaReq := IAPublicoRequest{
		EventoID:   input.EventoID,
		Titulo:     input.Titulo,
		TipoEvento: input.TipoEvento,
		Asistentes: asistentes,
	}

	iaResp, err := s.iaClient.AnalizarPublico(iaReq)
	if err != nil {
		log.Printf("❌ Error llamando al servicio de IA: %v", err)
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error al generar el análisis de público con IA")
	}

	// ── Serializar datos como JSON para almacenar en BD ─────────────────
	segmentosJSON, _ := json.Marshal(iaResp.Segmentos)
	distGeoJSON, _ := json.Marshal(iaResp.DistribucionGeografica)
	insightsJSON, _ := json.Marshal(iaResp.Insights)
	recsJSON, _ := json.Marshal(iaResp.RecomendacionesMarketing)

	a := &models.AnalisisPublico{
		EventoID:                 eventoUUID,
		TotalAnalizado:           iaResp.TotalAnalizado,
		Segmentos:                string(segmentosJSON),
		DistribucionGeografica:   string(distGeoJSON),
		PerfilPredominante:       iaResp.PerfilPredominante,
		Insights:                 string(insightsJSON),
		RecomendacionesMarketing: string(recsJSON),
	}

	if err := s.repo.CrearPublico(a); err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error guardando el análisis de público")
	}

	return toPublicoResponse(*a), nil
}

func (s *Service) ObtenerPublicoPorID(id int64) (*PublicoResponse, error) {
	a, err := s.repo.BuscarPublicoPorID(id)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusNotFound, "Análisis de público no encontrado")
	}
	return toPublicoResponse(*a), nil
}

func (s *Service) ListarPublicoPorEvento(eventoID string) ([]PublicoResponse, error) {
	analisis, err := s.repo.ListarPublicoPorEvento(eventoID)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error listando análisis de público")
	}
	var resp []PublicoResponse
	for _, a := range analisis {
		resp = append(resp, *toPublicoResponse(a))
	}
	return resp, nil
}

func (s *Service) Chat(input map[string]interface{}) (map[string]interface{}, error) {
	return s.iaClient.Chat(input)
}

func toPublicoResponse(a models.AnalisisPublico) *PublicoResponse {
	return &PublicoResponse{
		ID:                       a.ID,
		EventoID:                 a.EventoID.String(),
		TotalAnalizado:           a.TotalAnalizado,
		Segmentos:                a.Segmentos,
		DistribucionGeografica:   a.DistribucionGeografica,
		PerfilPredominante:       a.PerfilPredominante,
		Insights:                 a.Insights,
		RecomendacionesMarketing: a.RecomendacionesMarketing,
		GeneradoEn:               a.GeneradoEn.Format("2006-01-02T15:04:05Z07:00"),
	}
}
