package main

import (
	// "fmt"
	// "go/printer"
	"log"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("Error loading .env file")
		// log.Fatal("Error loading .env file")

	}

	CadenaConexion := os.Getenv("DATABASE_URL")

	gormDB, err := gorm.Open(postgres.Open(CadenaConexion), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	// Pool de conexiones
	sqlDB, _ := gormDB.DB()
	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetConnMaxLifetime(5 * time.Minute)

	log.Println("✅ Conectado a PostgreSQL")

	// ── INICIALIZAR DEPENDENCIAS ──────────────────────────────────────────
	// TODO: Inicializar paquetes internos `db` y `ws` si existen.
	// Si los paquetes `db` y `ws` están en el proyecto, importar y usar:
	// db.SetDB(gormDB)
	// wsHub := ws.NewHub()
	// go wsHub.Run()

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

	// IA (proxy hacia FastAPI Python)
	// iaHandler := handlers.NewIAHandler()
	// ia := protected.Group("/ia")
	// ia.Post("/prediccion", iaHandler.PrediccionAsistencia)
	// ia.Post("/segmentacion", iaHandler.Segmentacion)
	// ia.Post("/satisfaccion", iaHandler.AnalizarSatisfaccion)
	// ia.Get("/recomendaciones/:userId", iaHandler.Recomendaciones)

	// ── 10. ARRANCAR SERVIDOR ─────────────────────────────────────────────────
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 Servidor corriendo en http://localhost:%s", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("❌ Error al iniciar el servidor: %v", err)
	}

}
