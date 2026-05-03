package lugar

import (
	"main.go/db"
	"main.go/models"
)

type Repository struct{}

func NewRepository() *Repository {
	return &Repository{}
}

func (r *Repository) Crear(l *models.Lugar) error {
	return db.GetDB().Create(l).Error
}

func (r *Repository) BuscarPorID(id string) (*models.Lugar, error) {
	var l models.Lugar
	if err := db.GetDB().First(&l, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &l, nil
}

func (r *Repository) ListarTodos() ([]models.Lugar, error) {
	var lugares []models.Lugar
	if err := db.GetDB().Order("creado_en DESC").Find(&lugares).Error; err != nil {
		return nil, err
	}
	return lugares, nil
}

func (r *Repository) Actualizar(l *models.Lugar) error {
	return db.GetDB().Save(l).Error
}

func (r *Repository) Eliminar(id string) error {
	return db.GetDB().Delete(&models.Lugar{}, "id = ?", id).Error
}
