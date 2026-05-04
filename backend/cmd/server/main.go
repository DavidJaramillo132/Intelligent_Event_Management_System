package main

import (
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"
	"main.go/config"
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

	// ── CARGAR CONFIGURACIÓN ────────────────────────────────────────────────
	cfg := config.Load()
	log.Printf("🔧 Configuración cargada: Env=%s, Debug=%v", cfg.App.Env, cfg.App.Debug)

	// ── CONECTAR A LA BASE DE DATOS ─────────────────────────────────────────
	conn := db.Connect()
	db.Migrate(conn)

	// websocket
	wsHub := NewHub()
	go wsHub.Run()

	// ── CONFIGURAR FIBER ─────────────────────────────────────────────────

	app := fiber.New(fiber.Config{
		AppName:      "Eventos API v1.0",
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
		IdleTimeout:  cfg.Server.IdleTimeout,
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

	log.Printf("🚀 Servidor corriendo en http://localhost:%s", cfg.Server.Port)
	if err := app.Listen(":" + cfg.Server.Port); err != nil {
		log.Fatalf("❌ Error al iniciar el servidor: %v", err)
	}

}
