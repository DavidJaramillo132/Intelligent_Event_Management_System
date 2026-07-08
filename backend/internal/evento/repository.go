package evento

import (
	"strconv"
	"time"

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

// ListarConFiltros aplica filtros dinámicos de búsqueda pública
func (r *Repository) ListarConFiltros(f FiltrosEvento) ([]models.Evento, error) {
	var eventos []models.Evento
	q := db.GetDB().
		Preload("Organizador").
		Preload("TipoEvento").
		Preload("Lugar").
		Order("creado_en DESC")

	// Búsqueda semántica en título y descripción
	if f.Q != "" {
		like := "%" + f.Q + "%"
		q = q.Where("titulo ILIKE ? OR descripcion ILIKE ?", like, like)
	}

	// Filtro por tipo de evento
	if f.TipoEventoID != "" {
		q = q.Where("tipo_evento_id = ?", f.TipoEventoID)
	}

	// Filtro por rango de fechas
	if f.FechaInicio != "" {
		if t, err := time.Parse("2006-01-02", f.FechaInicio); err == nil {
			q = q.Where("inicio >= ?", t)
		}
	}
	if f.FechaFin != "" {
		if t, err := time.Parse("2006-01-02", f.FechaFin); err == nil {
			q = q.Where("fin <= ?", t.Add(24*time.Hour))
		}
	}

	// Filtro por rango de precios
	if f.CostoMin != "" {
		if v, err := strconv.ParseFloat(f.CostoMin, 64); err == nil {
			q = q.Where("costo >= ?", v)
		}
	}
	if f.CostoMax != "" {
		if v, err := strconv.ParseFloat(f.CostoMax, 64); err == nil {
			q = q.Where("costo <= ?", v)
		}
	}

	// Filtro de solo accesibles (JOIN con lugares)
	if f.SoloAccesibles {
		q = q.Joins("JOIN lugares ON lugares.id = eventos.lugar_id").
			Where("lugares.accesibilidad_fisica = true OR lugares.accesibilidad_sensorial = true")
	}

	if err := q.Find(&eventos).Error; err != nil {
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

// ContarCheckins retorna el número de check-ins registrados para un evento
func (r *Repository) ContarCheckins(eventoID string) int64 {
	var count int64
	db.GetDB().Model(&models.RegistroCheckin{}).
		Where("evento_id = ?", eventoID).
		Count(&count)
	return count
}

// ContarInscripciones retorna el número de inscripciones para un evento
func (r *Repository) ContarInscripciones(eventoID string) int64 {
	var count int64
	db.GetDB().Model(&models.Inscripcion{}).
		Where("evento_id = ? AND estado != 'cancelado'", eventoID).
		Count(&count)
	return count
}
