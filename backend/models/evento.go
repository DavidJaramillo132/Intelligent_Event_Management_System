package models

import (
	"time"

	"github.com/google/uuid"
)

type Evento struct {
	ID              uuid.UUID  `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	OrganizadorID   uuid.UUID  `gorm:"type:uuid;not null"                              json:"organizador_id"`
	TipoEventoID    int64      `gorm:"not null"                                        json:"tipo_evento_id"`
	LugarID         *uuid.UUID `gorm:"type:uuid"                                       json:"lugar_id,omitempty"`
	Titulo          string     `gorm:"type:varchar(180);not null"                      json:"titulo"`
	Descripcion     string     `gorm:"type:text"                                       json:"descripcion,omitempty"`
	Inicio          time.Time  `gorm:"not null"                                        json:"inicio"`
	Fin             time.Time  `gorm:"not null"                                        json:"fin"`
	Capacidad       int        `gorm:"not null"                                        json:"capacidad"`
	InicioRegistro  *time.Time `gorm:"default:null"                                    json:"inicio_registro,omitempty"`
	FinRegistro     *time.Time `gorm:"default:null"                                    json:"fin_registro,omitempty"`
	Costo           float64    `gorm:"type:numeric(10,2);not null;default:0"           json:"costo"`
	Estado          string     `gorm:"type:varchar(40);not null;default:'borrador'"    json:"estado"`
	ImagenPortada   string     `gorm:"type:text"                                       json:"imagen_portada,omitempty"`
	CreadoEn        time.Time  `gorm:"autoCreateTime"                                  json:"creado_en"`
	ActualizadoEn   time.Time  `gorm:"autoUpdateTime"                                  json:"actualizado_en"`

	// Relaciones (precargadas con Preload)
	Organizador  Usuario    `gorm:"foreignKey:OrganizadorID"  json:"organizador,omitempty"`
	TipoEvento   TipoEvento `gorm:"foreignKey:TipoEventoID"   json:"tipo_evento,omitempty"`
	Lugar        *Lugar     `gorm:"foreignKey:LugarID"        json:"lugar,omitempty"`
	Inscripciones  []Inscripcion    `gorm:"foreignKey:EventoID" json:"-"`
	Materiales     []MaterialEvento `gorm:"foreignKey:EventoID" json:"-"`
	TiposEntrada   []TipoEntrada    `gorm:"foreignKey:EventoID" json:"tipos_entrada,omitempty"`
	Sesiones       []SesionEvento   `gorm:"foreignKey:EventoID" json:"sesiones,omitempty"`
}

func (Evento) TableName() string {
	return "eventos"
}
