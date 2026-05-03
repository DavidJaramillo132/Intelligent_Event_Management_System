package evento

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

// ── MÉTODOS ──────────────────────────────────────────────────────────────────

func (s *Service) Crear(input CrearEventoInput) (*EventoResponse, error) {
	if input.Titulo == "" || input.OrganizadorID == "" {
		return nil, fiber.NewError(fiber.StatusBadRequest, "Título y organizador son requeridos")
	}
	if input.Capacidad <= 0 {
		return nil, fiber.NewError(fiber.StatusBadRequest, "La capacidad debe ser mayor a 0")
	}
	if input.Fin.Before(input.Inicio) {
		return nil, fiber.NewError(fiber.StatusBadRequest, "La fecha de fin debe ser posterior a la de inicio")
	}

	organizadorUUID, err := uuid.Parse(input.OrganizadorID)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusBadRequest, "organizador_id inválido")
	}

	e := &models.Evento{
		OrganizadorID:  organizadorUUID,
		TipoEventoID:   input.TipoEventoID,
		Titulo:          input.Titulo,
		Descripcion:     input.Descripcion,
		Inicio:          input.Inicio,
		Fin:             input.Fin,
		Capacidad:       input.Capacidad,
		InicioRegistro:  input.InicioRegistro,
		FinRegistro:     input.FinRegistro,
		Costo:           input.Costo,
		Estado:          "borrador",
	}

	if input.LugarID != nil {
		lugarUUID, err := uuid.Parse(*input.LugarID)
		if err != nil {
			return nil, fiber.NewError(fiber.StatusBadRequest, "lugar_id inválido")
		}
		e.LugarID = &lugarUUID
	}

	if err := s.repo.Crear(e); err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error creando el evento")
	}

	return toResponse(*e), nil
}

func (s *Service) ObtenerPorID(id string) (*EventoResponse, error) {
	e, err := s.repo.BuscarPorID(id)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusNotFound, "Evento no encontrado")
	}
	return toResponse(*e), nil
}

func (s *Service) ListarTodos() ([]EventoResponse, error) {
	eventos, err := s.repo.ListarTodos()
	if err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error listando eventos")
	}

	var resp []EventoResponse
	for _, e := range eventos {
		resp = append(resp, *toResponse(e))
	}
	return resp, nil
}

func (s *Service) ListarPorOrganizador(organizadorID string) ([]EventoResponse, error) {
	eventos, err := s.repo.ListarPorOrganizador(organizadorID)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error listando eventos del organizador")
	}

	var resp []EventoResponse
	for _, e := range eventos {
		resp = append(resp, *toResponse(e))
	}
	return resp, nil
}

func (s *Service) Actualizar(id string, input ActualizarEventoInput) (*EventoResponse, error) {
	e, err := s.repo.BuscarPorID(id)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusNotFound, "Evento no encontrado")
	}

	if input.TipoEventoID != nil {
		e.TipoEventoID = *input.TipoEventoID
	}
	if input.LugarID != nil {
		lugarUUID, err := uuid.Parse(*input.LugarID)
		if err != nil {
			return nil, fiber.NewError(fiber.StatusBadRequest, "lugar_id inválido")
		}
		e.LugarID = &lugarUUID
	}
	if input.Titulo != nil {
		e.Titulo = *input.Titulo
	}
	if input.Descripcion != nil {
		e.Descripcion = *input.Descripcion
	}
	if input.Inicio != nil {
		e.Inicio = *input.Inicio
	}
	if input.Fin != nil {
		e.Fin = *input.Fin
	}
	if input.Capacidad != nil {
		e.Capacidad = *input.Capacidad
	}
	if input.InicioRegistro != nil {
		e.InicioRegistro = input.InicioRegistro
	}
	if input.FinRegistro != nil {
		e.FinRegistro = input.FinRegistro
	}
	if input.Costo != nil {
		e.Costo = *input.Costo
	}
	if input.Estado != nil {
		e.Estado = *input.Estado
	}

	if err := s.repo.Actualizar(e); err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error actualizando el evento")
	}

	return toResponse(*e), nil
}

func (s *Service) Eliminar(id string) error {
	if _, err := s.repo.BuscarPorID(id); err != nil {
		return fiber.NewError(fiber.StatusNotFound, "Evento no encontrado")
	}
	if err := s.repo.Eliminar(id); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Error eliminando el evento")
	}
	return nil
}

// ── HELPERS ──────────────────────────────────────────────────────────────────

func toResponse(e models.Evento) *EventoResponse {
	resp := &EventoResponse{
		ID:            e.ID.String(),
		OrganizadorID: e.OrganizadorID.String(),
		TipoEventoID:  e.TipoEventoID,
		Titulo:         e.Titulo,
		Descripcion:    e.Descripcion,
		Inicio:         e.Inicio.Format("2006-01-02T15:04:05Z07:00"),
		Fin:            e.Fin.Format("2006-01-02T15:04:05Z07:00"),
		Capacidad:      e.Capacidad,
		Costo:          e.Costo,
		Estado:         e.Estado,
		CreadoEn:       e.CreadoEn.Format("2006-01-02T15:04:05Z07:00"),
		ActualizadoEn:  e.ActualizadoEn.Format("2006-01-02T15:04:05Z07:00"),
	}

	if e.LugarID != nil {
		lid := e.LugarID.String()
		resp.LugarID = &lid
	}
	if e.InicioRegistro != nil {
		ir := e.InicioRegistro.Format("2006-01-02T15:04:05Z07:00")
		resp.InicioRegistro = &ir
	}
	if e.FinRegistro != nil {
		fr := e.FinRegistro.Format("2006-01-02T15:04:05Z07:00")
		resp.FinRegistro = &fr
	}

	return resp
}
