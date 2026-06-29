package inscripcion

import (
	"fmt"
	"path/filepath"
	"strings"
	"time"

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

// POST /api/v1/inscripciones
// Acepta JSON o multipart/form-data (cuando se adjunta comprobante de pago).
func (h *Handler) Crear(c *fiber.Ctx) error {
	contentType := string(c.Request().Header.ContentType())

	var input CrearInscripcionInput

	if strings.Contains(contentType, "multipart/form-data") {
		// Leer campos del formulario
		input.EventoID = c.FormValue("evento_id")
		input.AsistenteID = c.FormValue("asistente_id")
		input.TipoEntradaID = c.FormValue("tipo_entrada_id")
		input.RequerimientosAccesibilidad = c.FormValue("requerimientos_accesibilidad")

		// Procesar comprobante si viene adjunto
		file, err := c.FormFile("comprobante")
		if err == nil && file != nil {
			ext := strings.ToLower(filepath.Ext(file.Filename))
			allowed := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".pdf": true}
			if !allowed[ext] {
				return fiber.NewError(fiber.StatusBadRequest, "Formato de comprobante no permitido. Use JPG, PNG o PDF")
			}
			if file.Size > 5*1024*1024 {
				return fiber.NewError(fiber.StatusBadRequest, "El comprobante no puede superar los 5 MB")
			}
			// Guardar el archivo en uploads/comprobantes/
			filename := fmt.Sprintf("comprobante_%s_%d%s", input.EventoID, time.Now().UnixMilli(), ext)
			savePath := fmt.Sprintf("./uploads/comprobantes/%s", filename)
			if err := c.SaveFile(file, savePath); err != nil {
				// No es crítico: loguear y continuar
				c.Context().Logger().Printf("advertencia: no se pudo guardar comprobante: %v", err)
			}
			input.ComprobanteURL = fmt.Sprintf("/uploads/comprobantes/%s", filename)
		}
	} else {
		if err := c.BodyParser(&input); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "JSON inválido")
		}
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
