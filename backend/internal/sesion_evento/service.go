package sesion_evento

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

func (s *Service) Crear(eventoID string, input CrearSesionInput) (*SesionResponse, error) {
	if input.Titulo == "" {
		return nil, fiber.NewError(fiber.StatusBadRequest, "El título de la sesión es requerido")
	}

	eventoUUID, err := uuid.Parse(eventoID)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusBadRequest, "evento_id inválido")
	}

	se := &models.SesionEvento{
		EventoID:    eventoUUID,
		Titulo:      input.Titulo,
		Descripcion: input.Descripcion,
		Inicio:      input.Inicio,
		Fin:         input.Fin,
		Ponente:     input.Ponente,
		Orden:       input.Orden,
	}

	if err := s.repo.Crear(se); err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error creando sesión")
	}

	return toResponse(*se), nil
}

func (s *Service) ListarPorEvento(eventoID string) ([]SesionResponse, error) {
	sesiones, err := s.repo.ListarPorEvento(eventoID)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error listando sesiones")
	}

	var resp []SesionResponse
	for _, se := range sesiones {
		resp = append(resp, *toResponse(se))
	}
	return resp, nil
}

func (s *Service) Eliminar(id string) error {
	if _, err := s.repo.BuscarPorID(id); err != nil {
		return fiber.NewError(fiber.StatusNotFound, "Sesión no encontrada")
	}
	return s.repo.Eliminar(id)
}

func toResponse(se models.SesionEvento) *SesionResponse {
	return &SesionResponse{
		ID:          se.ID.String(),
		EventoID:    se.EventoID.String(),
		Titulo:      se.Titulo,
		Descripcion: se.Descripcion,
		Inicio:      se.Inicio.Format("2006-01-02T15:04:05Z07:00"),
		Fin:         se.Fin.Format("2006-01-02T15:04:05Z07:00"),
		Ponente:     se.Ponente,
		Orden:       se.Orden,
	}
}
