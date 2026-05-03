package main

import (
	"log"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"
	"main.go/db"
	"main.go/router"
)

type Hub struct{}

func (h *Hub) Run() {
	// Aquí iría la lógica para manejar conexiones WebSocket
}
func NewHub() *Hub {
	return &Hub{}
}

func main() {
	// ── CARGAR VARIABLES DE ENTORNO ─────────────────────────────────────────
	if err := godotenv.Load(); err != nil {
		log.Printf("⚠️ No se pudo cargar .env, usando variables de entorno del sistema")
	}

	// ── CONECTAR A LA BASE DE DATOS ─────────────────────────────────────────
	conn := db.Connect()
	db.Migrate(conn)

	// websocket
	wsHub := NewHub()
	go wsHub.Run()

	// ── CONFIGURAR FIBER ─────────────────────────────────────────────────

	app := fiber.New(fiber.Config{
		AppName:      "Eventos API v1.0",
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		// Manejo global de errores
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(fiber.Map{
				"ok":    false,
				"error": err.Error(),
			})
		},
	})

	// ── HEALTH CHECK ──────────────────────────────────────────────────────
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"ok":      true,
			"service": "eventos-api",
			"time":    time.Now().Format(time.RFC3339),
		})
	})

	// ── REGISTRAR RUTAS ────────────────────────────────────────────────────
	router.Setup(app)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 Servidor corriendo en http://localhost:%s", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("❌ Error al iniciar el servidor: %v", err)
	}

}
