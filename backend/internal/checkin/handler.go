package checkin

import "github.com/gofiber/fiber/v2"

type Handler struct {
	service *Service
}

func NewHandler() *Handler {
	repo := NewRepository()
	service := NewService(repo)
	return &Handler{service: service}
}

// ══════════════════════════════════════════════════════════════════════════════
// ── MATERIALES ───────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

// POST /api/v1/materiales
func (h *Handler) CrearMaterial(c *fiber.Ctx) error {
	var input CrearMaterialInput
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "JSON inválido")
	}

	resp, err := h.service.CrearMaterial(input)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"ok":   true,
		"data": resp,
	})
}

// GET /api/v1/materiales/:id
func (h *Handler) ObtenerMaterial(c *fiber.Ctx) error {
	id := c.Params("id")

	resp, err := h.service.ObtenerMaterialPorID(id)
	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"ok":   true,
		"data": resp,
	})
}

// GET /api/v1/materiales/evento/:eventoId
func (h *Handler) ListarMaterialesPorEvento(c *fiber.Ctx) error {
	eventoID := c.Params("eventoId")

	resp, err := h.service.ListarMaterialesPorEvento(eventoID)
	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"ok":   true,
		"data": resp,
	})
}

// PUT /api/v1/materiales/:id
func (h *Handler) ActualizarMaterial(c *fiber.Ctx) error {
	id := c.Params("id")

	var input ActualizarMaterialInput
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "JSON inválido")
	}

	resp, err := h.service.ActualizarMaterial(id, input)
	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"ok":   true,
		"data": resp,
	})
}

// DELETE /api/v1/materiales/:id
func (h *Handler) EliminarMaterial(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := h.service.EliminarMaterial(id); err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"ok":      true,
		"message": "Material eliminado correctamente",
	})
}

// ══════════════════════════════════════════════════════════════════════════════
// ── CHECK-INS ────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

// POST /api/v1/checkins
func (h *Handler) CrearCheckin(c *fiber.Ctx) error {
	var input CrearCheckinInput
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "JSON inválido")
	}

	resp, err := h.service.CrearCheckin(input)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"ok":   true,
		"data": resp,
	})
}

// GET /api/v1/checkins/:id
func (h *Handler) ObtenerCheckin(c *fiber.Ctx) error {
	id := c.Params("id")

	resp, err := h.service.ObtenerCheckinPorID(id)
	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"ok":   true,
		"data": resp,
	})
}

// GET /api/v1/checkins/evento/:eventoId
func (h *Handler) ListarCheckinsPorEvento(c *fiber.Ctx) error {
	eventoID := c.Params("eventoId")

	resp, err := h.service.ListarCheckinsPorEvento(eventoID)
	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"ok":   true,
		"data": resp,
	})
}
