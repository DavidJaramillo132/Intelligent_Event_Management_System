package db

import (
	"log"

	"gorm.io/gorm"
	"main.go/models"
)

// Migrate aplica AutoMigrate únicamente para ajustes incrementales sobre el
// esquema base ya creado por docker/db/init/001_create_tables.sql.
// Solo incluir modelos que necesiten columnas nuevas que el SQL no tiene.
func Migrate(conn *gorm.DB) {
	if err := conn.AutoMigrate(
		&models.LogAuditoria{},
	); err != nil {
		log.Printf("⚠️  AutoMigrate warning: %v", err)
	} else {
		log.Println("✅ Migraciones completadas")
	}
}
