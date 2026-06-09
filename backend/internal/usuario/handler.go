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

	// resp == nil indica organizador pendiente de aprobación
	if resp == nil {
		return c.Status(fiber.StatusCreated).JSON(fiber.Map{
			"ok":      true,
			"pending": true,
			"message": "Registro exitoso. Tu cuenta como organizador está pendiente de aprobación por un administrador.",
		})
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
