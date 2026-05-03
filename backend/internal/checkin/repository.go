package checkin

import (
	"main.go/db"
	"main.go/models"
)

type Repository struct{}

func NewRepository() *Repository {
	return &Repository{}
}

// ── MaterialEvento ──────────────────────────────────────────────────────────

func (r *Repository) CrearMaterial(m *models.MaterialEvento) error {
	return db.GetDB().Create(m).Error
}

func (r *Repository) BuscarMaterialPorID(id string) (*models.MaterialEvento, error) {
	var m models.MaterialEvento
	if err := db.GetDB().First(&m, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *Repository) ListarMaterialesPorEvento(eventoID string) ([]models.MaterialEvento, error) {
	var materiales []models.MaterialEvento
	if err := db.GetDB().
		Where("evento_id = ?", eventoID).
		Order("creado_en DESC").
		Find(&materiales).Error; err != nil {
		return nil, err
	}
	return materiales, nil
}

func (r *Repository) ActualizarMaterial(m *models.MaterialEvento) error {
	return db.GetDB().Save(m).Error
}

func (r *Repository) EliminarMaterial(id string) error {
	return db.GetDB().Delete(&models.MaterialEvento{}, "id = ?", id).Error
}

// ── RegistroCheckin ─────────────────────────────────────────────────────────

func (r *Repository) CrearCheckin(c *models.RegistroCheckin) error {
	return db.GetDB().Create(c).Error
}

func (r *Repository) BuscarCheckinPorID(id string) (*models.RegistroCheckin, error) {
	var c models.RegistroCheckin
	if err := db.GetDB().First(&c, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *Repository) ListarCheckinsPorEvento(eventoID string) ([]models.RegistroCheckin, error) {
	var checkins []models.RegistroCheckin
	if err := db.GetDB().
		Where("evento_id = ?", eventoID).
		Order("ingreso_en DESC").
		Find(&checkins).Error; err != nil {
		return nil, err
	}
	return checkins, nil
}

func (r *Repository) ExisteCheckin(eventoID, inscripcionID string) bool {
	var count int64
	db.GetDB().Model(&models.RegistroCheckin{}).
		Where("evento_id = ? AND inscripcion_id = ?", eventoID, inscripcionID).
		Count(&count)
	return count > 0
}
