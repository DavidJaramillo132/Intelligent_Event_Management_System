package tipo_evento

import (
	"github.com/gofiber/fiber/v2"

	"main.go/models"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// ── MÉTODOS ──────────────────────────────────────────────────────────────────

func (s *Service) Crear(input CrearTipoEventoInput) (*TipoEventoResponse, error) {
	if input.Nombre == "" {
		return nil, fiber.NewError(fiber.StatusBadRequest, "El nombre es requerido")
	}
	if s.repo.ExisteNombre(input.Nombre) {
		return nil, fiber.NewError(fiber.StatusConflict, "Ya existe un tipo de evento con ese nombre")
	}

	t := &models.TipoEvento{
		Nombre:      input.Nombre,
		Descripcion: input.Descripcion,
	}

	if err := s.repo.Crear(t); err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error creando el tipo de evento")
	}

	return toResponse(*t), nil
}

func (s *Service) ObtenerPorID(id int64) (*TipoEventoResponse, error) {
	t, err := s.repo.BuscarPorID(id)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusNotFound, "Tipo de evento no encontrado")
	}
	return toResponse(*t), nil
}

func (s *Service) ListarTodos() ([]TipoEventoResponse, error) {
	tipos, err := s.repo.ListarTodos()
	if err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error listando tipos de evento")
	}

	var resp []TipoEventoResponse
	for _, t := range tipos {
		resp = append(resp, *toResponse(t))
	}
	return resp, nil
}

func (s *Service) Actualizar(id int64, input ActualizarTipoEventoInput) (*TipoEventoResponse, error) {
	t, err := s.repo.BuscarPorID(id)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusNotFound, "Tipo de evento no encontrado")
	}

	if input.Nombre != nil {
		if *input.Nombre != t.Nombre && s.repo.ExisteNombre(*input.Nombre) {
			return nil, fiber.NewError(fiber.StatusConflict, "Ya existe un tipo de evento con ese nombre")
		}
		t.Nombre = *input.Nombre
	}
	if input.Descripcion != nil {
		t.Descripcion = *input.Descripcion
	}

	if err := s.repo.Actualizar(t); err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error actualizando el tipo de evento")
	}

	return toResponse(*t), nil
}

func (s *Service) Eliminar(id int64) error {
	if _, err := s.repo.BuscarPorID(id); err != nil {
		return fiber.NewError(fiber.StatusNotFound, "Tipo de evento no encontrado")
	}
	if err := s.repo.Eliminar(id); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Error eliminando el tipo de evento")
	}
	return nil
}

// ── HELPERS ──────────────────────────────────────────────────────────────────

func toResponse(t models.TipoEvento) *TipoEventoResponse {
	return &TipoEventoResponse{
		ID:          t.ID,
		Nombre:      t.Nombre,
		Descripcion: t.Descripcion,
		CreadoEn:    t.CreadoEn.Format("2006-01-02T15:04:05Z07:00"),
	}
}
