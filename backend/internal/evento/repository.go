package evento

import (
	"main.go/db"
	"main.go/models"
)

type Repository struct{}

func NewRepository() *Repository {
	return &Repository{}
}

func (r *Repository) Crear(e *models.Evento) error {
	return db.GetDB().Create(e).Error
}

func (r *Repository) BuscarPorID(id string) (*models.Evento, error) {
	var e models.Evento
	if err := db.GetDB().
		Preload("Organizador").
		Preload("TipoEvento").
		Preload("Lugar").
		First(&e, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &e, nil
}

func (r *Repository) ListarTodos() ([]models.Evento, error) {
	var eventos []models.Evento
	if err := db.GetDB().
		Preload("Organizador").
		Preload("TipoEvento").
		Preload("Lugar").
		Order("creado_en DESC").
		Find(&eventos).Error; err != nil {
		return nil, err
	}
	return eventos, nil
}

func (r *Repository) ListarPorOrganizador(organizadorID string) ([]models.Evento, error) {
	var eventos []models.Evento
	if err := db.GetDB().
		Preload("TipoEvento").
		Preload("Lugar").
		Where("organizador_id = ?", organizadorID).
		Order("creado_en DESC").
		Find(&eventos).Error; err != nil {
		return nil, err
	}
	return eventos, nil
}

func (r *Repository) Actualizar(e *models.Evento) error {
	return db.GetDB().Save(e).Error
}

func (r *Repository) Eliminar(id string) error {
	return db.GetDB().Delete(&models.Evento{}, "id = ?", id).Error
}
