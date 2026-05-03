package inscripcion

import (
	"main.go/db"
	"main.go/models"
)

type Repository struct{}

func NewRepository() *Repository {
	return &Repository{}
}

// ── Inscripción ─────────────────────────────────────────────────────────────

func (r *Repository) Crear(i *models.Inscripcion) error {
	return db.GetDB().Create(i).Error
}

func (r *Repository) BuscarPorID(id string) (*models.Inscripcion, error) {
	var i models.Inscripcion
	if err := db.GetDB().
		Preload("Boleto").
		First(&i, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &i, nil
}

func (r *Repository) ListarPorEvento(eventoID string) ([]models.Inscripcion, error) {
	var inscripciones []models.Inscripcion
	if err := db.GetDB().
		Preload("Boleto").
		Where("evento_id = ?", eventoID).
		Order("registrado_en DESC").
		Find(&inscripciones).Error; err != nil {
		return nil, err
	}
	return inscripciones, nil
}

func (r *Repository) ListarPorAsistente(asistenteID string) ([]models.Inscripcion, error) {
	var inscripciones []models.Inscripcion
	if err := db.GetDB().
		Preload("Boleto").
		Preload("Evento").
		Where("asistente_id = ?", asistenteID).
		Order("registrado_en DESC").
		Find(&inscripciones).Error; err != nil {
		return nil, err
	}
	return inscripciones, nil
}

func (r *Repository) Actualizar(i *models.Inscripcion) error {
	return db.GetDB().Save(i).Error
}

func (r *Repository) ExisteInscripcion(eventoID, asistenteID string) bool {
	var count int64
	db.GetDB().Model(&models.Inscripcion{}).
		Where("evento_id = ? AND asistente_id = ?", eventoID, asistenteID).
		Count(&count)
	return count > 0
}

// ── Boleto ──────────────────────────────────────────────────────────────────

func (r *Repository) CrearBoleto(b *models.Boleto) error {
	return db.GetDB().Create(b).Error
}

func (r *Repository) BuscarBoletoPorInscripcion(inscripcionID string) (*models.Boleto, error) {
	var b models.Boleto
	if err := db.GetDB().Where("inscripcion_id = ?", inscripcionID).First(&b).Error; err != nil {
		return nil, err
	}
	return &b, nil
}

func (r *Repository) BuscarBoletoPorCodigo(codigo string) (*models.Boleto, error) {
	var b models.Boleto
	if err := db.GetDB().Where("codigo_boleto = ?", codigo).First(&b).Error; err != nil {
		return nil, err
	}
	return &b, nil
}

func (r *Repository) ActualizarBoleto(b *models.Boleto) error {
	return db.GetDB().Save(b).Error
}
