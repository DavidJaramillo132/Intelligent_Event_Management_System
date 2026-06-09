package models

import (
	"time"

	"github.com/google/uuid"
)

type Inscripcion struct {
	ID            uuid.UUID  `gorm:"type:uuid;default:uuid_generate_v4();primaryKey"        json:"id"`
	EventoID      uuid.UUID  `gorm:"type:uuid;not null;uniqueIndex:idx_evento_asistente"    json:"evento_id"`
	AsistenteID   uuid.UUID  `gorm:"type:uuid;not null;uniqueIndex:idx_evento_asistente"    json:"asistente_id"`
	TipoEntradaID *uuid.UUID `gorm:"type:uuid"                                             json:"tipo_entrada_id,omitempty"`
	Estado        string     `gorm:"type:varchar(40);not null;default:'inscrito'"           json:"estado"`
	RegistradoEn  time.Time  `gorm:"autoCreateTime"                                         json:"registrado_en"`
	ConfirmadoEn  *time.Time `gorm:"default:null"                                           json:"confirmado_en,omitempty"`
	CanceladoEn   *time.Time `gorm:"default:null"                                           json:"cancelado_en,omitempty"`

	// Relaciones
	Evento    Evento   `gorm:"foreignKey:EventoID"    json:"evento,omitempty"`
	Asistente Usuario  `gorm:"foreignKey:AsistenteID" json:"asistente,omitempty"`
	Boleto    *Boleto  `gorm:"foreignKey:InscripcionID" json:"boleto,omitempty"`
}

func (Inscripcion) TableName() string {
	return "inscripciones"
}

// ─────────────────────────────────────────────────────────────────────────────

type Boleto struct {
	ID            uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	InscripcionID uuid.UUID `gorm:"type:uuid;not null;uniqueIndex"                  json:"inscripcion_id"`
	CodigoBoleto  string    `gorm:"type:varchar(120);not null;uniqueIndex"          json:"codigo_boleto"`
	CodigoQR      string    `gorm:"type:text;not null"                              json:"codigo_qr"` // base64 o URL de la imagen QR
	EmitidoEn     time.Time `gorm:"autoCreateTime"                                  json:"emitido_en"`
	Estado        string    `gorm:"type:varchar(40);not null;default:'activo'"      json:"estado"`

	// Relaciones
	Inscripcion Inscripcion `gorm:"foreignKey:InscripcionID" json:"-"`
}

func (Boleto) TableName() string {
	return "boletos"
}
