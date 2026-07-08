package tipo_entrada

import (
	"main.go/db"
	"main.go/models"
)

type Repository struct{}

func NewRepository() *Repository {
	return &Repository{}
}

func (r *Repository) Crear(te *models.TipoEntrada) error {
	return db.GetDB().Create(te).Error
}

func (r *Repository) ListarPorEvento(eventoID string) ([]models.TipoEntrada, error) {
	var tipos []models.TipoEntrada
	if err := db.GetDB().Where("evento_id = ?", eventoID).Find(&tipos).Error; err != nil {
		return nil, err
	}
	return tipos, nil
}

func (r *Repository) BuscarPorID(id string) (*models.TipoEntrada, error) {
	var te models.TipoEntrada
	if err := db.GetDB().First(&te, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &te, nil
}

func (r *Repository) Actualizar(te *models.TipoEntrada) error {
	return db.GetDB().Save(te).Error
}

func (r *Repository) ContarInscritosPorEvento(eventoID string) (int64, error) {
	var count int64
	err := db.GetDB().Model(&models.Inscripcion{}).
		Where("evento_id = ? AND estado != 'cancelado'", eventoID).
		Count(&count).Error
	return count, err
}

func (r *Repository) ObtenerCapacidadEvento(eventoID string) (int, error) {
	var evento models.Evento
	if err := db.GetDB().
		Select("capacidad").
		First(&evento, "id = ?", eventoID).Error; err != nil {
		return 0, err
	}
	return evento.Capacidad, nil
}

func (r *Repository) IncrementarCupos(tipoEntradaID string) error {
	return db.GetDB().Model(&models.TipoEntrada{}).
		Where("id = ?", tipoEntradaID).
		UpdateColumn("cupos_usados", db.GetDB().Raw("cupos_usados + 1")).Error
}
