package config

import (
	"fmt"
	"os"
	"time"
)

// Config contiene toda la configuración de la aplicación
type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	JWT      JWTConfig
	App      AppConfig
}

// ServerConfig configuración del servidor Fiber
type ServerConfig struct {
	Port         string
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
	IdleTimeout  time.Duration
}

// DatabaseConfig configuración de PostgreSQL
type DatabaseConfig struct {
	Host            string
	Port            string
	User            string
	Password        string
	Name            string
	SSLMode         string
	Timezone        string
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
}

// JWTConfig configuración de autenticación JWT
type JWTConfig struct {
	Secret          string
	AccessDuration  time.Duration
	RefreshDuration time.Duration
}

// AppConfig configuración general de la app
type AppConfig struct {
	Env   string // "dev" o "prod"
	Debug bool
}

// Load carga y retorna la configuración desde variables de entorno
func Load() *Config {
	return &Config{
		Server: ServerConfig{
			Port:         getEnv("PORT", "8080"),
			ReadTimeout:  parseDuration(getEnv("SERVER_READ_TIMEOUT", "10s")),
			WriteTimeout: parseDuration(getEnv("SERVER_WRITE_TIMEOUT", "10s")),
			IdleTimeout:  parseDuration(getEnv("SERVER_IDLE_TIMEOUT", "30s")),
		},
		Database: DatabaseConfig{
			Host:            getEnv("DB_HOST", "localhost"),
			Port:            getEnv("DB_PORT", "5432"),
			User:            getEnv("DB_USER", "eventos_user"),
			Password:        getEnv("DB_PASSWORD", "eventos_pass"),
			Name:            getEnv("DB_NAME", "eventos_db"),
			SSLMode:         getEnv("DB_SSLMODE", "disable"),
			Timezone:        getEnv("DB_TIMEZONE", "America/Guayaquil"),
			MaxOpenConns:    parseIntWithDefault(getEnv("DB_MAX_OPEN_CONNS", "25"), 25),
			MaxIdleConns:    parseIntWithDefault(getEnv("DB_MAX_IDLE_CONNS", "10"), 10),
			ConnMaxLifetime: parseDuration(getEnv("DB_CONN_MAX_LIFETIME", "5m")),
		},
		JWT: JWTConfig{
			Secret:          getEnv("JWT_SECRET", "tu-super-secreto-cambiar-en-prod"),
			AccessDuration:  parseDuration(getEnv("JWT_ACCESS_DURATION", "24h")),
			RefreshDuration: parseDuration(getEnv("JWT_REFRESH_DURATION", "168h")), // 7 días
		},
		App: AppConfig{
			Env:   getEnv("APP_ENV", "dev"),
			Debug: getEnv("DEBUG", "false") == "true",
		},
	}
}

// DSN construye el Data Source Name para PostgreSQL
func (c *DatabaseConfig) DSN() string {
	// Opción 1: usar DATABASE_URL si está definida
	if url := os.Getenv("DATABASE_URL"); url != "" {
		return url
	}

	// Opción 2: construir desde componentes individuales
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s TimeZone=%s",
		c.Host, c.Port, c.User, c.Password, c.Name, c.SSLMode, c.Timezone,
	)
}

// ─────────────────────────────────────────────────────────────────────────────

// Helper para obtener variable de entorno con default
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// Helper para parsear duraciones
func parseDuration(s string) time.Duration {
	d, err := time.ParseDuration(s)
	if err != nil {
		return 10 * time.Second // fallback
	}
	return d
}

// Helper para parsear enteros
func parseIntWithDefault(s string, defaultValue int) int {
	if s == "" {
		return defaultValue
	}
	var result int
	if _, err := fmt.Sscanf(s, "%d", &result); err != nil {
		return defaultValue
	}
	return result
}
