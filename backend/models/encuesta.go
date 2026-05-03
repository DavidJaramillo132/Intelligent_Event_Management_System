package models

import (
	"time"

	"github.com/google/uuid"
)

type Encuesta struct {
	ID            int64     `gorm:"primaryKey;autoIncrement"                        json:"id"`
	EventoID      uuid.UUID `gorm:"type:uuid;not null"                              json:"evento_id"`
	Titulo        string    `gorm:"type:varchar(150);not null"                      json:"titulo"`
	Descripcion   string    `gorm:"type:text"                                       json:"descripcion,omitempty"`
	Activo        bool      `gorm:"not null;default:true"                           json:"activo"`
	CreadoEn      time.Time `gorm:"autoCreateTime"                                  json:"creado_en"`
	ActualizadoEn time.Time `gorm:"autoUpdateTime"                                  json:"actualizado_en"`

	// Relaciones
	Evento    Evento             `gorm:"foreignKey:EventoID"  json:"-"`
	Preguntas []PreguntaEncuesta `gorm:"foreignKey:EncuestaID" json:"preguntas,omitempty"`
}

func (Encuesta) TableName() string {
	return "encuestas"
}

// ─────────────────────────────────────────────────────────────────────────────

type PreguntaEncuesta struct {
	ID            int64     `gorm:"primaryKey;autoIncrement"                        json:"id"`
	EncuestaID    int64     `gorm:"not null"                                        json:"encuesta_id"`
	TextoPregunta string    `gorm:"type:text;not null"                              json:"texto_pregunta"`
	TipoPregunta  string    `gorm:"type:varchar(40);not null"                       json:"tipo_pregunta"` // escala | texto | opcion_multiple
	Requerido     bool      `gorm:"not null;default:false"                          json:"requerido"`
	Opciones      string    `gorm:"type:text"                                       json:"opciones,omitempty"` // JSON string con opciones
	Orden         int       `gorm:"not null;default:0"                              json:"orden"`
	CreadoEn      time.Time `gorm:"autoCreateTime"                                  json:"creado_en"`

	// Relaciones
	Encuesta Encuesta `gorm:"foreignKey:EncuestaID" json:"-"`
}

func (PreguntaEncuesta) TableName() string {
	return "preguntas_encuesta"
}

// ─────────────────────────────────────────────────────────────────────────────

// RespuestaEncuesta es la cabecera de una respuesta completa (un asistente, una encuesta)
type RespuestaEncuesta struct {
	ID            int64      `gorm:"primaryKey;autoIncrement"   json:"id"`
	EncuestaID    int64      `gorm:"not null"                   json:"encuesta_id"`
	InscripcionID *uuid.UUID `gorm:"type:uuid"                  json:"inscripcion_id,omitempty"`
	EnviadoEn     time.Time  `gorm:"autoCreateTime"             json:"enviado_en"`

	// Relaciones
	Encuesta    Encuesta                  `gorm:"foreignKey:EncuestaID"    json:"-"`
	Inscripcion *Inscripcion              `gorm:"foreignKey:InscripcionID" json:"-"`
	Respuestas  []RespuestaPreguntaEncuesta `gorm:"foreignKey:RespuestaID" json:"respuestas,omitempty"`
}

func (RespuestaEncuesta) TableName() string {
	return "respuestas_encuesta"
}

// ─────────────────────────────────────────────────────────────────────────────

// RespuestaPreguntaEncuesta es la respuesta individual por pregunta
type RespuestaPreguntaEncuesta struct {
	ID              int64    `gorm:"primaryKey;autoIncrement"  json:"id"`
	RespuestaID     int64    `gorm:"not null"                  json:"respuesta_id"`
	PreguntaID      int64    `gorm:"not null"                  json:"pregunta_id"`
	Respuesta       string   `gorm:"type:text"                 json:"respuesta,omitempty"`
	PuntajeNumerico *float64 `gorm:"type:numeric(5,2)"         json:"puntaje_numerico,omitempty"`
	CreadoEn        time.Time `gorm:"autoCreateTime"           json:"creado_en"`

	// Relaciones
	Pregunta PreguntaEncuesta `gorm:"foreignKey:PreguntaID" json:"pregunta,omitempty"`
}

func (RespuestaPreguntaEncuesta) TableName() string {
	return "respuestas_pregunta_encuesta"
}
