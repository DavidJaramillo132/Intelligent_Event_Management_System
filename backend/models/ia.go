package models

import (
	"time"

	"github.com/google/uuid"
)

type PrediccionAsistencia struct {
	ID                  int64      `gorm:"primaryKey;autoIncrement"          json:"id"`
	EventoID            uuid.UUID  `gorm:"type:uuid;not null"                json:"evento_id"`
	AsistenciaPredicha  int        `gorm:"not null"                          json:"asistencia_predicha"`
	Confianza           *float64   `gorm:"type:numeric(5,2)"                 json:"confianza,omitempty"`
	VersionModelo       string     `gorm:"type:varchar(80)"                  json:"version_modelo,omitempty"`
	GeneradoEn          time.Time  `gorm:"autoCreateTime"                    json:"generado_en"`
	Notas               string     `gorm:"type:text"                         json:"notas,omitempty"`

	// Relaciones
	Evento Evento `gorm:"foreignKey:EventoID" json:"-"`
}

func (PrediccionAsistencia) TableName() string {
	return "predicciones_asistencia"
}

// ─────────────────────────────────────────────────────────────────────────────

type AnalisisSatisfaccion struct {
	ID                 int64      `gorm:"primaryKey;autoIncrement"  json:"id"`
	EventoID           uuid.UUID  `gorm:"type:uuid;not null"        json:"evento_id"`
	PuntajePromedio    *float64   `gorm:"type:numeric(5,2)"         json:"puntaje_promedio,omitempty"`
	ResumenSentimiento string     `gorm:"type:text"                 json:"resumen_sentimiento,omitempty"`
	PuntosPositivos    string     `gorm:"type:text"                 json:"puntos_positivos,omitempty"`
	PuntosMejora       string     `gorm:"type:text"                 json:"puntos_mejora,omitempty"`
	GeneradoEn         time.Time  `gorm:"autoCreateTime"            json:"generado_en"`

	// Relaciones
	Evento Evento `gorm:"foreignKey:EventoID" json:"-"`
}

func (AnalisisSatisfaccion) TableName() string {
	return "analisis_satisfaccion"
}
