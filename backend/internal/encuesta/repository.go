package encuesta

import (
	"gorm.io/gorm"

	"main.go/db"
	"main.go/models"
)

type Repository struct{}

func NewRepository() *Repository {
	return &Repository{}
}

// ── Encuesta ────────────────────────────────────────────────────────────────

func (r *Repository) CrearEncuesta(e *models.Encuesta) error {
	return db.GetDB().Create(e).Error
}

func (r *Repository) BuscarEncuestaPorID(id int64) (*models.Encuesta, error) {
	var e models.Encuesta
	if err := db.GetDB().
		Preload("Preguntas", func(tx *gorm.DB) *gorm.DB {
			return tx.Order("orden ASC")
		}).
		First(&e, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &e, nil
}

func (r *Repository) ListarEncuestasPorEvento(eventoID string) ([]models.Encuesta, error) {
	var encuestas []models.Encuesta
	if err := db.GetDB().
		Preload("Preguntas", func(tx *gorm.DB) *gorm.DB {
			return tx.Order("orden ASC")
		}).
		Where("evento_id = ?", eventoID).
		Order("creado_en DESC").
		Find(&encuestas).Error; err != nil {
		return nil, err
	}
	return encuestas, nil
}

func (r *Repository) ActualizarEncuesta(e *models.Encuesta) error {
	return db.GetDB().Save(e).Error
}

func (r *Repository) EliminarEncuesta(id int64) error {
	return db.GetDB().Delete(&models.Encuesta{}, "id = ?", id).Error
}

// ── Pregunta ────────────────────────────────────────────────────────────────

func (r *Repository) CrearPregunta(p *models.PreguntaEncuesta) error {
	return db.GetDB().Create(p).Error
}

func (r *Repository) BuscarPreguntaPorID(id int64) (*models.PreguntaEncuesta, error) {
	var p models.PreguntaEncuesta
	if err := db.GetDB().First(&p, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *Repository) ActualizarPregunta(p *models.PreguntaEncuesta) error {
	return db.GetDB().Save(p).Error
}

func (r *Repository) EliminarPregunta(id int64) error {
	return db.GetDB().Delete(&models.PreguntaEncuesta{}, "id = ?", id).Error
}

// ── Respuesta ───────────────────────────────────────────────────────────────

func (r *Repository) CrearRespuestaEncuesta(re *models.RespuestaEncuesta) error {
	return db.GetDB().Create(re).Error
}

func (r *Repository) CrearRespuestaPregunta(rp *models.RespuestaPreguntaEncuesta) error {
	return db.GetDB().Create(rp).Error
}

func (r *Repository) ListarRespuestasPorEncuesta(encuestaID int64) ([]models.RespuestaEncuesta, error) {
	var respuestas []models.RespuestaEncuesta
	if err := db.GetDB().
		Preload("Respuestas").
		Preload("Respuestas.Pregunta").
		Where("encuesta_id = ?", encuestaID).
		Order("enviado_en DESC").
		Find(&respuestas).Error; err != nil {
		return nil, err
	}
	return respuestas, nil
}

func (r *Repository) BuscarRespuestaEncuestaPorID(id int64) (*models.RespuestaEncuesta, error) {
	var re models.RespuestaEncuesta
	if err := db.GetDB().
		Preload("Respuestas").
		First(&re, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &re, nil
}

// ExisteRespuesta verifica si ya existe una respuesta de un asistente (via inscripcion_id)
func (r *Repository) ExisteRespuesta(encuestaID int64, inscripcionID string) (bool, error) {
	var count int64
	err := db.GetDB().Model(&models.RespuestaEncuesta{}).
		Where("encuesta_id = ? AND inscripcion_id = ?", encuestaID, inscripcionID).
		Count(&count).Error
	return count > 0, err
}
