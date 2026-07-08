package models

import (
	"github.com/google/uuid"
)

type TipoEntrada struct {
	ID          uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	EventoID    uuid.UUID `gorm:"type:uuid;not null"                              json:"evento_id"`
	Nombre      string    `gorm:"type:varchar(100);not null"                      json:"nombre"`
	Precio      float64   `gorm:"type:numeric(10,2);not null;default:0"           json:"precio"`
	CuposTotal  int       `gorm:"not null"                                        json:"cupos_total"`
	CuposUsados int       `gorm:"not null;default:0"                              json:"cupos_usados"`
	Descripcion string    `gorm:"type:text"                                       json:"descripcion,omitempty"`

	// Relaciones
	Evento Evento `gorm:"foreignKey:EventoID" json:"-"`
}

func (TipoEntrada) TableName() string {
	return "tipos_entrada"
}
