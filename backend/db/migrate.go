package db

import (
	"log"

	"gorm.io/gorm"
	"main.go/models"
)

// Migrate aplica AutoMigrate sólo para los modelos que requieren sincronización de esquema.
// El esquema base se gestiona con docker/db/init/001_create_tables.sql.
func Migrate(conn *gorm.DB) {
	if err := conn.AutoMigrate(
		&models.Usuario{},
		&models.LogAuditoria{},
	); err != nil {
		log.Printf("⚠️  AutoMigrate warning: %v", err)
	} else {
		log.Println("✅ Migraciones completadas")
	}
}
