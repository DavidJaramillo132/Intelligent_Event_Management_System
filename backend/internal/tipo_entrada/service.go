package tipo_entrada

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

func (s *Service) Crear(eventoID string, input CrearTipoEntradaInput) (*TipoEntradaResponse, error) {
	if input.Nombre == "" {
		return nil, fiber.NewError(fiber.StatusBadRequest, "El nombre del tipo de entrada es requerido")
	}
	if input.CuposTotal <= 0 {
		return nil, fiber.NewError(fiber.StatusBadRequest, "Los cupos deben ser mayor a 0")
	}

	eventoUUID, err := uuid.Parse(eventoID)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusBadRequest, "evento_id inválido")
	}

	te := &models.TipoEntrada{
		EventoID:    eventoUUID,
		Nombre:      input.Nombre,
		Precio:      input.Precio,
		CuposTotal:  input.CuposTotal,
		Descripcion: input.Descripcion,
	}

	if err := s.repo.Crear(te); err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error creando tipo de entrada")
	}

	return toResponse(*te), nil
}

func (s *Service) ListarPorEvento(eventoID string) ([]TipoEntradaResponse, error) {
	tipos, err := s.repo.ListarPorEvento(eventoID)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error listando tipos de entrada")
	}

	var resp []TipoEntradaResponse
	for _, te := range tipos {
		resp = append(resp, *toResponse(te))
	}
	return resp, nil
}

func (s *Service) ObtenerDisponibilidad(eventoID string, capacidadTotal int) (*DisponibilidadResponse, error) {
	if capacidadTotal <= 0 {
		capacidad, err := s.repo.ObtenerCapacidadEvento(eventoID)
		if err != nil {
			return nil, fiber.NewError(fiber.StatusNotFound, "Evento no encontrado")
		}
		capacidadTotal = capacidad
	}

	tipos, err := s.repo.ListarPorEvento(eventoID)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error consultando disponibilidad")
	}

	inscritos, err := s.repo.ContarInscritosPorEvento(eventoID)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error contando inscritos")
	}

	var tiposResp []TipoEntradaResponse
	for _, te := range tipos {
		tiposResp = append(tiposResp, *toResponse(te))
	}

	cuposDisponibles := capacidadTotal - int(inscritos)
	if cuposDisponibles < 0 {
		cuposDisponibles = 0
	}

	return &DisponibilidadResponse{
		CapacidadTotal:   capacidadTotal,
		Inscritos:        int(inscritos),
		CuposDisponibles: cuposDisponibles,
		TiposEntrada:     tiposResp,
	}, nil
}

func toResponse(te models.TipoEntrada) *TipoEntradaResponse {
	return &TipoEntradaResponse{
		ID:          te.ID.String(),
		EventoID:    te.EventoID.String(),
		Nombre:      te.Nombre,
		Precio:      te.Precio,
		CuposTotal:  te.CuposTotal,
		CuposUsados: te.CuposUsados,
		Disponible:  te.CuposUsados < te.CuposTotal,
		Descripcion: te.Descripcion,
	}
}
