package incidencia

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"main.go/models"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Crear(input CrearIncidenciaInput) (*IncidenciaResponse, error) {
	if input.EventoID == "" || input.Descripcion == "" {
		return nil, fiber.NewError(fiber.StatusBadRequest, "evento_id y descripcion son requeridos")
	}

	criticidad := input.Criticidad
	if criticidad != "informativa" && criticidad != "advertencia" && criticidad != "critica" {
		criticidad = "informativa"
	}

	eventoUUID, err := uuid.Parse(input.EventoID)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusBadRequest, "evento_id inválido")
	}

	inc := &models.IncidenciaEvento{
		EventoID:    eventoUUID,
		Criticidad:  criticidad,
		Descripcion: input.Descripcion,
	}

	if err := s.repo.Crear(inc); err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error registrando la incidencia")
	}

	return toResponse(*inc), nil
}

func (s *Service) ListarPorEvento(eventoID string) ([]IncidenciaResponse, error) {
	incidencias, err := s.repo.ListarPorEvento(eventoID)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error listando incidencias")
	}

	var resp []IncidenciaResponse
	for _, inc := range incidencias {
		resp = append(resp, *toResponse(inc))
	}
	return resp, nil
}

func toResponse(inc models.IncidenciaEvento) *IncidenciaResponse {
	return &IncidenciaResponse{
		ID:          inc.ID.String(),
		EventoID:    inc.EventoID.String(),
		Criticidad:  inc.Criticidad,
		Descripcion: inc.Descripcion,
		CreadoEn:    inc.CreadoEn.Format("2006-01-02T15:04:05Z07:00"),
	}
}
