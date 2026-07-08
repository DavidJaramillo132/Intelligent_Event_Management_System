package incidencia

import (
	"main.go/db"
	"main.go/models"
)

type Repository struct{}

func NewRepository() *Repository {
	return &Repository{}
}

func (r *Repository) Crear(inc *models.IncidenciaEvento) error {
	return db.GetDB().Create(inc).Error
}

func (r *Repository) ListarPorEvento(eventoID string) ([]models.IncidenciaEvento, error) {
	var incidencias []models.IncidenciaEvento
	if err := db.GetDB().
		Where("evento_id = ?", eventoID).
		Order("creado_en DESC").
		Find(&incidencias).Error; err != nil {
		return nil, err
	}
	return incidencias, nil
}
