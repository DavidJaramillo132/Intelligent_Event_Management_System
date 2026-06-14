package incidencia

import "github.com/gofiber/fiber/v2"

type Handler struct {
	service *Service
}

func NewHandler() *Handler {
	repo := NewRepository()
	service := NewService(repo)
	return &Handler{service: service}
}

// POST /api/v1/incidencias
func (h *Handler) Crear(c *fiber.Ctx) error {
	var input CrearIncidenciaInput
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "JSON inválido")
	}

	resp, err := h.service.Crear(input)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"ok":   true,
		"data": resp,
	})
}

// GET /api/v1/incidencias/evento/:eventoId
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
