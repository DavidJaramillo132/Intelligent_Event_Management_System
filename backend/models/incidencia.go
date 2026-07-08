package models

import (
	"time"

	"github.com/google/uuid"
)

type IncidenciaEvento struct {
	ID          uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	EventoID    uuid.UUID `gorm:"type:uuid;not null"                              json:"evento_id"`
	Criticidad  string    `gorm:"type:varchar(40);not null;default:'informativa'" json:"criticidad"` // informativa | advertencia | critica
	Descripcion string    `gorm:"type:text;not null"                              json:"descripcion"`
	CreadoEn    time.Time `gorm:"autoCreateTime"                                  json:"creado_en"`

	// Relaciones
	Evento Evento `gorm:"foreignKey:EventoID" json:"-"`
}

func (IncidenciaEvento) TableName() string {
	return "incidencias_evento"
}
