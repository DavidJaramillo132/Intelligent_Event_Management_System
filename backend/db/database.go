package db

import (
	"fmt"
	"log"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// instancia global privada
var db *gorm.DB

// Connect abre la conexión con PostgreSQL y configura el pool.
// Se llama una sola vez desde main.go
func Connect() *gorm.DB {
	dsn := buildDSN()

	gormLogger := logger.Default.LogMode(logLevel())

	conn, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger:                                   gormLogger,
		PrepareStmt:                              true,  // cachea statements → más rápido
		DisableForeignKeyConstraintWhenMigrating: false, // respeta FK en migraciones
	})
	if err != nil {
		log.Fatalf("❌ No se pudo conectar a PostgreSQL: %v", err)
	}

	// ── Pool de conexiones ──────────────────────────────────────────────────
	sqlDB, err := conn.DB()
	if err != nil {
		log.Fatalf("❌ Error obteniendo instancia sql.DB: %v", err)
	}

	sqlDB.SetMaxOpenConns(25)              // máximo de conexiones abiertas
	sqlDB.SetMaxIdleConns(10)             // conexiones en espera reutilizables
	sqlDB.SetConnMaxLifetime(5 * time.Minute) // tiempo de vida de cada conexión

	// ── Verificar que la DB responde ────────────────────────────────────────
	if err := sqlDB.Ping(); err != nil {
		log.Fatalf("❌ PostgreSQL no responde al ping: %v", err)
	}

	log.Println("✅ Conectado a PostgreSQL")

	db = conn
	return conn
}

// GetDB retorna la instancia global.
// Usar en handlers: db.GetDB().Find(...)
func GetDB() *gorm.DB {
	if db == nil {
		log.Fatal("❌ GetDB() llamado antes de Connect()")
	}
	return db
}

// SetDB permite inyectar la instancia desde main.go (útil para tests)
func SetDB(conn *gorm.DB) {
	db = conn
}

// ── Helpers privados ─────────────────────────────────────────────────────────

// buildDSN construye el DSN desde variables de entorno individuales
// o usa DATABASE_URL directamente si está definida.
func buildDSN() string {
	// Opción 1: DATABASE_URL completa (Docker / producción)
	if url := os.Getenv("DATABASE_URL"); url != "" {
		return url
	}

	// Opción 2: variables individuales (desarrollo local)
	host     := getEnv("DB_HOST", "localhost")
	port     := getEnv("DB_PORT", "5432")
	user     := getEnv("DB_USER", "eventos_user")
	password := getEnv("DB_PASSWORD", "eventos_pass")
	dbname   := getEnv("DB_NAME", "eventos_db")
	sslmode  := getEnv("DB_SSLMODE", "disable")
	timezone := getEnv("DB_TIMEZONE", "America/Guayaquil")

	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s TimeZone=%s",
		host, port, user, password, dbname, sslmode, timezone,
	)
}

// logLevel devuelve Silent en producción e Info en desarrollo
func logLevel() logger.LogLevel {
	if os.Getenv("APP_ENV") == "production" {
		return logger.Silent
	}
	return logger.Info
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}	