package models

import (
	"time"

	"github.com/google/uuid"
)

type SesionEvento struct {
	ID          uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	EventoID    uuid.UUID `gorm:"type:uuid;not null"                              json:"evento_id"`
	Titulo      string    `gorm:"type:varchar(200);not null"                      json:"titulo"`
	Descripcion string    `gorm:"type:text"                                       json:"descripcion,omitempty"`
	Inicio      time.Time `gorm:"not null"                                        json:"inicio"`
	Fin         time.Time `gorm:"not null"                                        json:"fin"`
	Ponente     string    `gorm:"type:varchar(150)"                               json:"ponente,omitempty"`
	Sala        string    `gorm:"type:varchar(150)"                               json:"sala,omitempty"`
	Orden       int       `gorm:"not null;default:0"                              json:"orden"`

	// Relaciones
	Evento Evento `gorm:"foreignKey:EventoID" json:"-"`
}

func (SesionEvento) TableName() string {
	return "sesiones_evento"
}
