package usuario

import "github.com/gofiber/fiber/v2"

type Handler struct {
	service *Service
}

func NewHandler() *Handler {
	repo := NewRepository()
	service := NewService(repo)
	return &Handler{service: service}
}

// POST /api/v1/auth/register
func (h *Handler) Register(c *fiber.Ctx) error {
	var input RegisterInput
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "JSON inválido")
	}

	resp, err := h.service.Registrar(input, c.IP())
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"ok":   true,
		"data": resp,
	})
}

// POST /api/v1/auth/login
func (h *Handler) Login(c *fiber.Ctx) error {
	var input LoginInput
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "JSON inválido")
	}

	resp, err := h.service.Login(input, c.IP())
	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"ok":   true,
		"data": resp,
	})
}

// POST /api/v1/auth/refresh
func (h *Handler) Refresh(c *fiber.Ctx) error {
	var body struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := c.BodyParser(&body); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "JSON inválido")
	}

	resp, err := h.service.Refresh(body.RefreshToken)
	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"ok":   true,
		"data": resp,
	})
}

func (h *Handler) ObtenerPerfil(c *fiber.Ctx) error {
	usuarioID, ok := c.Locals("usuario_id").(string)
	if !ok || usuarioID == "" {
		return fiber.NewError(fiber.StatusUnauthorized, "Usuario no autenticado")
	}

	perfil, err := h.service.ObtenerPerfil(usuarioID)
	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"ok":   true,
		"data": perfil,
	})
}

func (h *Handler) ActualizarPerfil(c *fiber.Ctx) error {
	usuarioID, ok := c.Locals("usuario_id").(string)
	if !ok || usuarioID == "" {
		return fiber.NewError(fiber.StatusUnauthorized, "Usuario no autenticado")
	}

	var input UpdateProfileInput
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "JSON invalido")
	}

	perfil, err := h.service.ActualizarPerfil(usuarioID, input, c.IP())
	if err != nil {
		return writeFieldError(c, err)
	}

	return c.JSON(fiber.Map{
		"ok":   true,
		"data": perfil,
	})
}

func (h *Handler) CambiarContrasena(c *fiber.Ctx) error {
	usuarioID, ok := c.Locals("usuario_id").(string)
	if !ok || usuarioID == "" {
		return fiber.NewError(fiber.StatusUnauthorized, "Usuario no autenticado")
	}

	var input ChangePasswordInput
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "JSON invalido")
	}

	if err := h.service.CambiarContrasena(usuarioID, input, c.IP()); err != nil {
		return writeFieldError(c, err)
	}

	return c.JSON(fiber.Map{
		"ok":      true,
		"message": "Contrasena actualizada",
	})
}

func writeFieldError(c *fiber.Ctx, err error) error {
	if e, ok := err.(*FieldError); ok {
		return c.Status(e.Status).JSON(fiber.Map{
			"ok":      false,
			"message": e.Message,
			"field":   e.Field,
		})
	}
	return err
}
