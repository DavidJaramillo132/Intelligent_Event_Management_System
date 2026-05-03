package ia

import (
	"main.go/db"
	"main.go/models"
)

type Repository struct{}

func NewRepository() *Repository { return &Repository{} }

// ── Predicciones ────────────────────────────────────────────────────────────

func (r *Repository) CrearPrediccion(p *models.PrediccionAsistencia) error {
	return db.GetDB().Create(p).Error
}

func (r *Repository) BuscarPrediccionPorID(id int64) (*models.PrediccionAsistencia, error) {
	var p models.PrediccionAsistencia
	if err := db.GetDB().First(&p, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *Repository) ListarPrediccionesPorEvento(eventoID string) ([]models.PrediccionAsistencia, error) {
	var preds []models.PrediccionAsistencia
	if err := db.GetDB().Where("evento_id = ?", eventoID).Order("generado_en DESC").Find(&preds).Error; err != nil {
		return nil, err
	}
	return preds, nil
}

// ── Análisis satisfacción ───────────────────────────────────────────────────

func (r *Repository) CrearAnalisis(a *models.AnalisisSatisfaccion) error {
	return db.GetDB().Create(a).Error
}

func (r *Repository) BuscarAnalisisPorID(id int64) (*models.AnalisisSatisfaccion, error) {
	var a models.AnalisisSatisfaccion
	if err := db.GetDB().First(&a, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *Repository) ListarAnalisisPorEvento(eventoID string) ([]models.AnalisisSatisfaccion, error) {
	var analisis []models.AnalisisSatisfaccion
	if err := db.GetDB().Where("evento_id = ?", eventoID).Order("generado_en DESC").Find(&analisis).Error; err != nil {
		return nil, err
	}
	return analisis, nil
}
