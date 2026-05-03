package models

import (
	"time"

	"github.com/google/uuid"
)

type MaterialEvento struct {
	ID            uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	EventoID      uuid.UUID `gorm:"type:uuid;not null"                              json:"evento_id"`
	Nombre        string    `gorm:"type:varchar(150);not null"                      json:"nombre"`
	Cantidad      int       `gorm:"not null;default:1"                              json:"cantidad"`
	Estado        string    `gorm:"type:varchar(40);not null;default:'pendiente'"   json:"estado"`
	Notas         string    `gorm:"type:text"                                       json:"notas,omitempty"`
	CreadoEn      time.Time `gorm:"autoCreateTime"                                  json:"creado_en"`
	ActualizadoEn time.Time `gorm:"autoUpdateTime"                                  json:"actualizado_en"`

	// Relaciones
	Evento Evento `gorm:"foreignKey:EventoID" json:"-"`
}

func (MaterialEvento) TableName() string {
	return "materiales_evento"
}

// ─────────────────────────────────────────────────────────────────────────────

type RegistroCheckin struct {
	ID            uuid.UUID  `gorm:"type:uuid;default:uuid_generate_v4();primaryKey"     json:"id"`
	EventoID      uuid.UUID  `gorm:"type:uuid;not null;uniqueIndex:idx_checkin_unico"     json:"evento_id"`
	InscripcionID uuid.UUID  `gorm:"type:uuid;not null;uniqueIndex:idx_checkin_unico"     json:"inscripcion_id"`
	BoletoID      uuid.UUID  `gorm:"type:uuid;not null"                                   json:"boleto_id"`
	RevisadoPor   *uuid.UUID `gorm:"type:uuid"                                            json:"revisado_por,omitempty"`
	IngresoEn     time.Time  `gorm:"autoCreateTime"                                       json:"ingreso_en"`
	EstadoAcceso  string     `gorm:"type:varchar(40);not null;default:'permitido'"        json:"estado_acceso"`
	Notas         string     `gorm:"type:text"                                            json:"notas,omitempty"`

	// Relaciones
	Evento      Evento      `gorm:"foreignKey:EventoID"      json:"evento,omitempty"`
	Inscripcion Inscripcion `gorm:"foreignKey:InscripcionID" json:"inscripcion,omitempty"`
	Boleto      Boleto      `gorm:"foreignKey:BoletoID"      json:"boleto,omitempty"`
	Revisor     *Usuario    `gorm:"foreignKey:RevisadoPor"   json:"revisor,omitempty"`
}

func (RegistroCheckin) TableName() string {
	return "registros_checkin"
}
