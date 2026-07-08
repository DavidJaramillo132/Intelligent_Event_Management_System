package sesion_evento

import "github.com/gofiber/fiber/v2"

type Handler struct {
	service *Service
}

func NewHandler() *Handler {
	repo := NewRepository()
	service := NewService(repo)
	return &Handler{service: service}
}

// POST /api/v1/eventos/:eventoId/sesiones
func (h *Handler) Crear(c *fiber.Ctx) error {
	eventoID := c.Params("eventoId")

	var input CrearSesionInput
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

// GET /api/v1/eventos/:eventoId/sesiones
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

// DELETE /api/v1/sesiones/:id
func (h *Handler) Eliminar(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := h.service.Eliminar(id); err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"ok":      true,
		"message": "Sesión eliminada correctamente",
	})
}
