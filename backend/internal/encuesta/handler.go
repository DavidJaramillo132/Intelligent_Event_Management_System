package encuesta

import (
	"strconv"
	"github.com/gofiber/fiber/v2"
)

type Handler struct {
	service *Service
}

func NewHandler() *Handler {
	return &Handler{service: NewService(NewRepository())}
}

// POST /api/v1/encuestas
func (h *Handler) CrearEncuesta(c *fiber.Ctx) error {
	var input CrearEncuestaInput
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "JSON inválido")
	}
	resp, err := h.service.CrearEncuesta(input)
	if err != nil { return err }
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"ok": true, "data": resp})
}

// GET /api/v1/encuestas/:id
func (h *Handler) ObtenerEncuesta(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil { return fiber.NewError(fiber.StatusBadRequest, "ID inválido") }
	resp, err := h.service.ObtenerEncuestaPorID(id)
	if err != nil { return err }
	return c.JSON(fiber.Map{"ok": true, "data": resp})
}

// GET /api/v1/encuestas/evento/:eventoId
func (h *Handler) ListarPorEvento(c *fiber.Ctx) error {
	resp, err := h.service.ListarPorEvento(c.Params("eventoId"))
	if err != nil { return err }
	return c.JSON(fiber.Map{"ok": true, "data": resp})
}

// PUT /api/v1/encuestas/:id
func (h *Handler) ActualizarEncuesta(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil { return fiber.NewError(fiber.StatusBadRequest, "ID inválido") }
	var input ActualizarEncuestaInput
	if err := c.BodyParser(&input); err != nil { return fiber.NewError(fiber.StatusBadRequest, "JSON inválido") }
	resp, err := h.service.ActualizarEncuesta(id, input)
	if err != nil { return err }
	return c.JSON(fiber.Map{"ok": true, "data": resp})
}

// DELETE /api/v1/encuestas/:id
func (h *Handler) EliminarEncuesta(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil { return fiber.NewError(fiber.StatusBadRequest, "ID inválido") }
	if err := h.service.EliminarEncuesta(id); err != nil { return err }
	return c.JSON(fiber.Map{"ok": true, "message": "Encuesta eliminada correctamente"})
}

// POST /api/v1/encuestas/:id/preguntas
func (h *Handler) AgregarPregunta(c *fiber.Ctx) error {
	encuestaID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil { return fiber.NewError(fiber.StatusBadRequest, "ID inválido") }
	var input CrearPreguntaInput
	if err := c.BodyParser(&input); err != nil { return fiber.NewError(fiber.StatusBadRequest, "JSON inválido") }
	resp, err := h.service.AgregarPregunta(encuestaID, input)
	if err != nil { return err }
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"ok": true, "data": resp})
}

// PUT /api/v1/preguntas/:id
func (h *Handler) ActualizarPregunta(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil { return fiber.NewError(fiber.StatusBadRequest, "ID inválido") }
	var input ActualizarPreguntaInput
	if err := c.BodyParser(&input); err != nil { return fiber.NewError(fiber.StatusBadRequest, "JSON inválido") }
	resp, err := h.service.ActualizarPregunta(id, input)
	if err != nil { return err }
	return c.JSON(fiber.Map{"ok": true, "data": resp})
}

// DELETE /api/v1/preguntas/:id
func (h *Handler) EliminarPregunta(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil { return fiber.NewError(fiber.StatusBadRequest, "ID inválido") }
	if err := h.service.EliminarPregunta(id); err != nil { return err }
	return c.JSON(fiber.Map{"ok": true, "message": "Pregunta eliminada correctamente"})
}

// POST /api/v1/encuestas/responder
func (h *Handler) EnviarRespuesta(c *fiber.Ctx) error {
	var input EnviarRespuestaInput
	if err := c.BodyParser(&input); err != nil { return fiber.NewError(fiber.StatusBadRequest, "JSON inválido") }
	resp, err := h.service.EnviarRespuesta(input)
	if err != nil { return err }
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"ok": true, "data": resp})
}

// GET /api/v1/encuestas/:id/respuestas
func (h *Handler) ListarRespuestas(c *fiber.Ctx) error {
	encuestaID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil { return fiber.NewError(fiber.StatusBadRequest, "ID inválido") }
	resp, err := h.service.ListarRespuestasPorEncuesta(encuestaID)
	if err != nil { return err }
	return c.JSON(fiber.Map{"ok": true, "data": resp})
}
