package tipo_entrada

import "github.com/gofiber/fiber/v2"

type Handler struct {
	service *Service
}

func NewHandler() *Handler {
	repo := NewRepository()
	service := NewService(repo)
	return &Handler{service: service}
}

// POST /api/v1/eventos/:eventoId/tipos-entrada
func (h *Handler) Crear(c *fiber.Ctx) error {
	eventoID := c.Params("eventoId")

	var input CrearTipoEntradaInput
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "JSON inválido")
	}

	resp, err := h.service.Crear(eventoID, input)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"ok":   true,
		"data": resp,
	})
}

// GET /api/v1/eventos/:eventoId/tipos-entrada
func (h *Handler) ListarPorEvento(c *fiber.Ctx) error {
	eventoID := c.Params("eventoId")

	resp, err := h.service.ListarPorEvento(eventoID)
	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"ok":   true,
		"data": resp,
	})
}

// GET /api/v1/eventos/:eventoId/disponibilidad
func (h *Handler) Disponibilidad(c *fiber.Ctx) error {
	eventoID := c.Params("eventoId")

	// Obtener capacidad del evento (se simplifica consultando el servicio de evento)
	resp, err := h.service.ObtenerDisponibilidad(eventoID, 0)
	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"ok":   true,
		"data": resp,
	})
}
