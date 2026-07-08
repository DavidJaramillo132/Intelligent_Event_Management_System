package sesion_evento

import (
	"main.go/db"
	"main.go/models"
)

type Repository struct{}

func NewRepository() *Repository {
	return &Repository{}
}

func (r *Repository) Crear(s *models.SesionEvento) error {
	return db.GetDB().Create(s).Error
}

func (r *Repository) ListarPorEvento(eventoID string) ([]models.SesionEvento, error) {
	var sesiones []models.SesionEvento
	if err := db.GetDB().
		Where("evento_id = ?", eventoID).
		Order("orden ASC, inicio ASC").
		Find(&sesiones).Error; err != nil {
		return nil, err
	}
	return sesiones, nil
}

func (r *Repository) BuscarPorID(id string) (*models.SesionEvento, error) {
	var s models.SesionEvento
	if err := db.GetDB().First(&s, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *Repository) Actualizar(s *models.SesionEvento) error {
	return db.GetDB().Save(s).Error
}

func (r *Repository) Eliminar(id string) error {
	return db.GetDB().Delete(&models.SesionEvento{}, "id = ?", id).Error
}
