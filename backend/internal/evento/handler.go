package evento

import "github.com/gofiber/fiber/v2"

type Handler struct {
	service *Service
}

func NewHandler() *Handler {
	repo := NewRepository()
	service := NewService(repo)
	return &Handler{service: service}
}

// POST /api/v1/eventos
func (h *Handler) Crear(c *fiber.Ctx) error {
	var input CrearEventoInput
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

// GET /api/v1/eventos/:id
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

// GET /api/v1/eventos  — soporta query params de búsqueda/filtrado
func (h *Handler) Listar(c *fiber.Ctx) error {
	filtros := FiltrosEvento{
		Q:              c.Query("q"),
		TipoEventoID:   c.Query("tipo_evento_id"),
		FechaInicio:    c.Query("fecha_inicio"),
		FechaFin:       c.Query("fecha_fin"),
		CostoMin:       c.Query("costo_min"),
		CostoMax:       c.Query("costo_max"),
		SoloAccesibles: c.Query("solo_accesibles") == "true",
	}

	// Si no hay ningún filtro activo, usamos el listing simple
	hayFiltros := filtros.Q != "" ||
		filtros.TipoEventoID != "" ||
		filtros.FechaInicio != "" ||
		filtros.FechaFin != "" ||
		filtros.CostoMin != "" ||
		filtros.CostoMax != "" ||
		filtros.SoloAccesibles

	var (
		resp []EventoResponse
		err  error
	)

	if hayFiltros {
		resp, err = h.service.ListarConFiltros(filtros)
	} else {
		resp, err = h.service.ListarTodos()
	}

	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"ok":   true,
		"data": resp,
	})
}

// GET /api/v1/eventos/organizador/:organizadorId
func (h *Handler) ListarPorOrganizador(c *fiber.Ctx) error {
	organizadorID := c.Params("organizadorId")

	resp, err := h.service.ListarPorOrganizador(organizadorID)
	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"ok":   true,
		"data": resp,
	})
}

// PUT /api/v1/eventos/:id
func (h *Handler) Actualizar(c *fiber.Ctx) error {
	id := c.Params("id")

	var input ActualizarEventoInput
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

// DELETE /api/v1/eventos/:id
func (h *Handler) Eliminar(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := h.service.Eliminar(id); err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"ok":      true,
		"message": "Evento eliminado correctamente",
	})
}
