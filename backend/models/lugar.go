package models

import (
	"time"

	"github.com/google/uuid"
)

type Lugar struct {
	ID            uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	Nombre        string    `gorm:"type:varchar(150);not null"                      json:"nombre"`
	Direccion     string    `gorm:"type:text;not null"                              json:"direccion"`
	Ciudad        string    `gorm:"type:varchar(100);not null"                      json:"ciudad"`
	Provincia     string    `gorm:"type:varchar(100)"                               json:"provincia,omitempty"`
	Pais          string    `gorm:"type:varchar(100);not null;default:'Ecuador'"    json:"pais"`
	Capacidad     int       `gorm:"not null"                                        json:"capacidad"`
	Descripcion   string    `gorm:"type:text"                                       json:"descripcion,omitempty"`
	CreadoEn      time.Time `gorm:"autoCreateTime"                                  json:"creado_en"`
	ActualizadoEn time.Time `gorm:"autoUpdateTime"                                  json:"actualizado_en"`

	// Relaciones
	Eventos []Evento `gorm:"foreignKey:LugarID" json:"-"`
}

func (Lugar) TableName() string {
	return "lugares"
}
