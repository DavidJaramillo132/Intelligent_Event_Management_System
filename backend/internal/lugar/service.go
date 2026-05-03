package lugar

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

func (s *Service) Crear(input CrearLugarInput) (*LugarResponse, error) {
	if input.Nombre == "" || input.Direccion == "" || input.Ciudad == "" {
		return nil, fiber.NewError(fiber.StatusBadRequest, "Nombre, dirección y ciudad son requeridos")
	}
	if input.Capacidad <= 0 {
		return nil, fiber.NewError(fiber.StatusBadRequest, "La capacidad debe ser mayor a 0")
	}

	pais := input.Pais
	if pais == "" {
		pais = "Ecuador"
	}

	l := &models.Lugar{
		Nombre:      input.Nombre,
		Direccion:   input.Direccion,
		Ciudad:      input.Ciudad,
		Provincia:   input.Provincia,
		Pais:        pais,
		Capacidad:   input.Capacidad,
		Descripcion: input.Descripcion,
	}

	if err := s.repo.Crear(l); err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error creando el lugar")
	}

	return toResponse(*l), nil
}

func (s *Service) ObtenerPorID(id string) (*LugarResponse, error) {
	l, err := s.repo.BuscarPorID(id)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusNotFound, "Lugar no encontrado")
	}
	return toResponse(*l), nil
}

func (s *Service) ListarTodos() ([]LugarResponse, error) {
	lugares, err := s.repo.ListarTodos()
	if err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error listando lugares")
	}

	var resp []LugarResponse
	for _, l := range lugares {
		resp = append(resp, *toResponse(l))
	}
	return resp, nil
}

func (s *Service) Actualizar(id string, input ActualizarLugarInput) (*LugarResponse, error) {
	l, err := s.repo.BuscarPorID(id)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusNotFound, "Lugar no encontrado")
	}

	if input.Nombre != nil {
		l.Nombre = *input.Nombre
	}
	if input.Direccion != nil {
		l.Direccion = *input.Direccion
	}
	if input.Ciudad != nil {
		l.Ciudad = *input.Ciudad
	}
	if input.Provincia != nil {
		l.Provincia = *input.Provincia
	}
	if input.Pais != nil {
		l.Pais = *input.Pais
	}
	if input.Capacidad != nil {
		l.Capacidad = *input.Capacidad
	}
	if input.Descripcion != nil {
		l.Descripcion = *input.Descripcion
	}

	if err := s.repo.Actualizar(l); err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error actualizando el lugar")
	}

	return toResponse(*l), nil
}

func (s *Service) Eliminar(id string) error {
	if _, err := s.repo.BuscarPorID(id); err != nil {
		return fiber.NewError(fiber.StatusNotFound, "Lugar no encontrado")
	}
	if err := s.repo.Eliminar(id); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Error eliminando el lugar")
	}
	return nil
}

// ── HELPERS ──────────────────────────────────────────────────────────────────

func toResponse(l models.Lugar) *LugarResponse {
	return &LugarResponse{
		ID:            l.ID.String(),
		Nombre:        l.Nombre,
		Direccion:     l.Direccion,
		Ciudad:        l.Ciudad,
		Provincia:     l.Provincia,
		Pais:          l.Pais,
		Capacidad:     l.Capacidad,
		Descripcion:   l.Descripcion,
		CreadoEn:      l.CreadoEn.Format("2006-01-02T15:04:05Z07:00"),
		ActualizadoEn: l.ActualizadoEn.Format("2006-01-02T15:04:05Z07:00"),
	}
}
