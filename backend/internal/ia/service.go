package ia

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"main.go/models"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service { return &Service{repo: repo} }

// ── Predicciones ────────────────────────────────────────────────────────────

func (s *Service) CrearPrediccion(input CrearPrediccionInput) (*PrediccionResponse, error) {
	if input.EventoID == "" || input.AsistenciaPredicha <= 0 {
		return nil, fiber.NewError(fiber.StatusBadRequest, "evento_id y asistencia_predicha son requeridos")
	}
	eventoUUID, err := uuid.Parse(input.EventoID)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusBadRequest, "evento_id inválido")
	}
	p := &models.PrediccionAsistencia{EventoID: eventoUUID, AsistenciaPredicha: input.AsistenciaPredicha, Confianza: input.Confianza, VersionModelo: input.VersionModelo, Notas: input.Notas}
	if err := s.repo.CrearPrediccion(p); err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error creando la predicción")
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
	a := &models.AnalisisSatisfaccion{EventoID: eventoUUID, PuntajePromedio: input.PuntajePromedio, ResumenSentimiento: input.ResumenSentimiento, PuntosPositivos: input.PuntosPositivos, PuntosMejora: input.PuntosMejora}
	if err := s.repo.CrearAnalisis(a); err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error creando el análisis")
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
	return &PrediccionResponse{ID: p.ID, EventoID: p.EventoID.String(), AsistenciaPredicha: p.AsistenciaPredicha, Confianza: p.Confianza, VersionModelo: p.VersionModelo, GeneradoEn: p.GeneradoEn.Format("2006-01-02T15:04:05Z07:00"), Notas: p.Notas}
}

func toAnalisisResponse(a models.AnalisisSatisfaccion) *AnalisisResponse {
	return &AnalisisResponse{ID: a.ID, EventoID: a.EventoID.String(), PuntajePromedio: a.PuntajePromedio, ResumenSentimiento: a.ResumenSentimiento, PuntosPositivos: a.PuntosPositivos, PuntosMejora: a.PuntosMejora, GeneradoEn: a.GeneradoEn.Format("2006-01-02T15:04:05Z07:00")}
}
