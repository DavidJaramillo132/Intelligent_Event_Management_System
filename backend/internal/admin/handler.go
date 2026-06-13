package admin

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

// GET /api/v1/admin/usuarios
func (h *Handler) ListarUsuarios(c *fiber.Ctx) error {
	pagina, _ := strconv.Atoi(c.Query("pagina", "1"))
	limite, _ := strconv.Atoi(c.Query("limite", "20"))

	result, err := h.service.ListarUsuarios(ListarUsuariosParams{
		Pagina:   pagina,
		Limite:   limite,
		Rol:      c.Query("rol"),
		Busqueda: c.Query("busqueda"),
		Estado:   c.Query("estado"),
	})
	if err != nil {
		return err
	}
	return c.JSON(fiber.Map{"ok": true, "data": result})
}

// POST /api/v1/admin/usuarios
func (h *Handler) CrearUsuario(c *fiber.Ctx) error {
	adminID, _ := c.Locals("usuario_id").(string)

	var input CrearUsuarioInput
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "JSON inválido")
	}

	result, err := h.service.CrearUsuario(adminID, input, c.IP())
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"ok":      true,
		"message": "Usuario creado correctamente",
		"data":    result,
	})
}

// PATCH /api/v1/admin/usuarios/:id/rol
func (h *Handler) ActualizarRol(c *fiber.Ctx) error {
	targetID := c.Params("id")
	adminID, _ := c.Locals("usuario_id").(string)

	var input ActualizarRolInput
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "JSON inválido")
	}

	if err := h.service.ActualizarRol(adminID, targetID, input.Rol, c.IP()); err != nil {
		return err
	}
	return c.JSON(fiber.Map{"ok": true, "message": "Rol actualizado correctamente"})
}

// PATCH /api/v1/admin/usuarios/:id/estado
func (h *Handler) ActualizarEstado(c *fiber.Ctx) error {
	targetID := c.Params("id")
	adminID, _ := c.Locals("usuario_id").(string)

	var input ActualizarEstadoInput
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "JSON inválido")
	}

	if err := h.service.ActualizarEstado(adminID, targetID, input.Activo, c.IP()); err != nil {
		return err
	}
	return c.JSON(fiber.Map{"ok": true, "message": "Estado actualizado correctamente"})
}

// GET /api/v1/admin/auditoria
func (h *Handler) ListarLogs(c *fiber.Ctx) error {
	pagina, _ := strconv.Atoi(c.Query("pagina", "1"))
	limite, _ := strconv.Atoi(c.Query("limite", "50"))

	result, err := h.service.ListarLogs(FiltrosAuditoria{
		FechaInicio: c.Query("fecha_inicio"),
		FechaFin:    c.Query("fecha_fin"),
		Usuario:     c.Query("usuario"),
		TipoAccion:  c.Query("tipo_accion"),
		Pagina:      pagina,
		Limite:      limite,
	})
	if err != nil {
		return err
	}
	return c.JSON(fiber.Map{"ok": true, "data": result})
}
