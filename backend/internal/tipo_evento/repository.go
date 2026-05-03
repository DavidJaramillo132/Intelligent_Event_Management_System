package tipo_evento

import (
	"main.go/db"
	"main.go/models"
)

type Repository struct{}

func NewRepository() *Repository {
	return &Repository{}
}

func (r *Repository) Crear(t *models.TipoEvento) error {
	return db.GetDB().Create(t).Error
}

func (r *Repository) BuscarPorID(id int64) (*models.TipoEvento, error) {
	var t models.TipoEvento
	if err := db.GetDB().First(&t, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *Repository) ListarTodos() ([]models.TipoEvento, error) {
	var tipos []models.TipoEvento
	if err := db.GetDB().Order("nombre ASC").Find(&tipos).Error; err != nil {
		return nil, err
	}
	return tipos, nil
}

func (r *Repository) Actualizar(t *models.TipoEvento) error {
	return db.GetDB().Save(t).Error
}

func (r *Repository) Eliminar(id int64) error {
	return db.GetDB().Delete(&models.TipoEvento{}, "id = ?", id).Error
}

func (r *Repository) ExisteNombre(nombre string) bool {
	var count int64
	db.GetDB().Model(&models.TipoEvento{}).Where("nombre = ?", nombre).Count(&count)
	return count > 0
}
