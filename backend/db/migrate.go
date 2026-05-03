package db

import (
	"log"

	"gorm.io/gorm"
)

// Migrate se mantiene como punto de entrada, pero el esquema real
// se administra con el SQL de docker/db/init/001_create_tables.sql.
// Se evita AutoMigrate porque puede chocar con constraints ya existentes.
func Migrate(conn *gorm.DB) {
	_ = conn
	log.Println("✅ Migraciones omitidas: usando schema SQL existente")
}
