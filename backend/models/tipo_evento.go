package models

import "time"

type TipoEvento struct {
	ID          int64     `gorm:"primaryKey;autoIncrement"       json:"id"`
	Nombre      string    `gorm:"type:varchar(100);not null;uniqueIndex" json:"nombre"`
	Descripcion string    `gorm:"type:text"                      json:"descripcion,omitempty"`
	CreadoEn    time.Time `gorm:"autoCreateTime"                 json:"creado_en"`

	// Relaciones
	Eventos []Evento `gorm:"foreignKey:TipoEventoID" json:"-"`
}

func (TipoEvento) TableName() string {
	return "tipos_evento"
}
