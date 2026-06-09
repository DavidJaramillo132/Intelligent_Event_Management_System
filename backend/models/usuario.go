package models

import (
	"time"

	"github.com/google/uuid"
)

type Usuario struct {
	ID                uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	Nombre            string    `gorm:"type:varchar(100);not null"                      json:"nombre"`
	Apellido          string    `gorm:"type:varchar(100);not null"                      json:"apellido"`
	CorreoElectronico string    `gorm:"type:varchar(150);not null;uniqueIndex"          json:"correo_electronico"`
	Ciudad            string    `gorm:"type:varchar(100)"                               json:"ciudad,omitempty"`
	Provincia         string    `gorm:"type:varchar(100)"                               json:"provincia,omitempty"`
	Pais              string    `gorm:"type:varchar(100);not null;default:'Ecuador'"    json:"pais"`
	Telefono          string    `gorm:"type:varchar(30)"                                json:"telefono,omitempty"`
	ContrasenaHash    string    `gorm:"type:text;not null"                              json:"-"` // nunca se serializa
	Rol               string    `gorm:"type:varchar(30);not null;default:'asistente'"      json:"rol"`
	Activo            bool      `gorm:"not null;default:true"                              json:"activo"`
	EstadoCuenta      string    `gorm:"type:varchar(30);not null;default:'activo'"         json:"estado_cuenta"`
	CreadoEn          time.Time `gorm:"autoCreateTime"                                     json:"creado_en"`
	ActualizadoEn     time.Time `gorm:"autoUpdateTime"                                     json:"actualizado_en"`

	// Relaciones
	EventosOrganizados []Evento      `gorm:"foreignKey:OrganizadorID"  json:"-"`
	Inscripciones      []Inscripcion `gorm:"foreignKey:AsistenteID"    json:"-"`
}

func (Usuario) TableName() string {
	return "usuarios"
}
