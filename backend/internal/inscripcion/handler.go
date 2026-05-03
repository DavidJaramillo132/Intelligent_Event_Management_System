package inscripcion

import "github.com/gofiber/fiber/v2"

type Handler struct {
	service *Service
}

func NewHandler() *Handler {
	repo := NewRepository()
	service := NewService(repo)
	return &Handler{service: service}
}

// POST /api/v1/inscripciones
func (h *Handler) Crear(c *fiber.Ctx) error {
	var input CrearInscripcionInput
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

// GET /api/v1/inscripciones/:id
func (h *Handler) ObtenerPorID(c *fiber.Ctx) error {
	id := c.Params("id")

	resp, err := h.service.ObtenerPorID(id)
	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"ok":   true,
		"data": resp,
	})
}

// GET /api/v1/inscripciones/evento/:eventoId
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

// GET /api/v1/inscripciones/asistente/:asistenteId
func (h *Handler) ListarPorAsistente(c *fiber.Ctx) error {
	asistenteID := c.Params("asistenteId")

	resp, err := h.service.ListarPorAsistente(asistenteID)
	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"ok":   true,
		"data": resp,
	})
}

// PATCH /api/v1/inscripciones/:id/estado
func (h *Handler) ActualizarEstado(c *fiber.Ctx) error {
	id := c.Params("id")

	var input ActualizarEstadoInput
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "JSON inválido")
	}

	resp, err := h.service.ActualizarEstado(id, input)
	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"ok":   true,
		"data": resp,
	})
}
