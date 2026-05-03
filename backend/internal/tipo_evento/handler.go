package tipo_evento

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type Handler struct {
	service *Service
}

func NewHandler() *Handler {
	repo := NewRepository()
	service := NewService(repo)
	return &Handler{service: service}
}

// POST /api/v1/tipos-evento
func (h *Handler) Crear(c *fiber.Ctx) error {
	var input CrearTipoEventoInput
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

// GET /api/v1/tipos-evento/:id
func (h *Handler) ObtenerPorID(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID inválido")
	}

	resp, err := h.service.ObtenerPorID(id)
	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"ok":   true,
		"data": resp,
	})
}

// GET /api/v1/tipos-evento
func (h *Handler) Listar(c *fiber.Ctx) error {
	resp, err := h.service.ListarTodos()
	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"ok":   true,
		"data": resp,
	})
}

// PUT /api/v1/tipos-evento/:id
func (h *Handler) Actualizar(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID inválido")
	}

	var input ActualizarTipoEventoInput
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "JSON inválido")
	}

	resp, err := h.service.Actualizar(id, input)
	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"ok":   true,
		"data": resp,
	})
}

// DELETE /api/v1/tipos-evento/:id
func (h *Handler) Eliminar(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID inválido")
	}

	if err := h.service.Eliminar(id); err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"ok":      true,
		"message": "Tipo de evento eliminado correctamente",
	})
}
