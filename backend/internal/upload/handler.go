package upload

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type Handler struct{}

func NewHandler() *Handler {
	return &Handler{}
}

// POST /api/v1/uploads
func (h *Handler) Subir(c *fiber.Ctx) error {
	file, err := c.FormFile("archivo")
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Se requiere un archivo en el campo 'archivo'")
	}

	// Validar tamaño máximo (5 MB)
	if file.Size > 5*1024*1024 {
		return fiber.NewError(fiber.StatusBadRequest, "El archivo no debe superar 5 MB")
	}

	// Validar extensión
	ext := filepath.Ext(file.Filename)
	permitidas := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true, ".gif": true}
	if !permitidas[ext] {
		return fiber.NewError(fiber.StatusBadRequest, "Extensión no permitida. Use: jpg, jpeg, png, webp, gif")
	}

	// Crear directorio de uploads si no existe
	uploadDir := "./uploads"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Error creando directorio de uploads")
	}

	// Generar nombre único
	nombre := fmt.Sprintf("%d-%s%s", time.Now().UnixNano(), uuid.New().String()[:8], ext)
	ruta := filepath.Join(uploadDir, nombre)

	// Guardar archivo
	if err := c.SaveFile(file, ruta); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Error guardando el archivo")
	}

	url := fmt.Sprintf("/uploads/%s", nombre)

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"ok": true,
		"data": fiber.Map{
			"url":      url,
			"nombre":   file.Filename,
			"tamano":   file.Size,
		},
	})
}
