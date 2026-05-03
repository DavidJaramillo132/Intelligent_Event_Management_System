package ia

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

// POST /api/v1/ia/predicciones
func (h *Handler) CrearPrediccion(c *fiber.Ctx) error {
	var input CrearPrediccionInput
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "JSON inválido")
	}
	resp, err := h.service.CrearPrediccion(input)
	if err != nil { return err }
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"ok": true, "data": resp})
}

// GET /api/v1/ia/predicciones/:id
func (h *Handler) ObtenerPrediccion(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil { return fiber.NewError(fiber.StatusBadRequest, "ID inválido") }
	resp, err := h.service.ObtenerPrediccionPorID(id)
	if err != nil { return err }
	return c.JSON(fiber.Map{"ok": true, "data": resp})
}

// GET /api/v1/ia/predicciones/evento/:eventoId
func (h *Handler) ListarPrediccionesPorEvento(c *fiber.Ctx) error {
	resp, err := h.service.ListarPrediccionesPorEvento(c.Params("eventoId"))
	if err != nil { return err }
	return c.JSON(fiber.Map{"ok": true, "data": resp})
}

// POST /api/v1/ia/analisis
func (h *Handler) CrearAnalisis(c *fiber.Ctx) error {
	var input CrearAnalisisInput
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "JSON inválido")
	}
	resp, err := h.service.CrearAnalisis(input)
	if err != nil { return err }
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"ok": true, "data": resp})
}

// GET /api/v1/ia/analisis/:id
func (h *Handler) ObtenerAnalisis(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil { return fiber.NewError(fiber.StatusBadRequest, "ID inválido") }
	resp, err := h.service.ObtenerAnalisisPorID(id)
	if err != nil { return err }
	return c.JSON(fiber.Map{"ok": true, "data": resp})
}

// GET /api/v1/ia/analisis/evento/:eventoId
func (h *Handler) ListarAnalisisPorEvento(c *fiber.Ctx) error {
	resp, err := h.service.ListarAnalisisPorEvento(c.Params("eventoId"))
	if err != nil { return err }
	return c.JSON(fiber.Map{"ok": true, "data": resp})
}
