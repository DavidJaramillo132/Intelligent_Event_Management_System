package admin

import (
	"strings"
	"time"

	"main.go/db"
	"main.go/models"
)

type Repository struct{}

func NewRepository() *Repository {
	return &Repository{}
}

// ─── Usuarios ─────────────────────────────────────────────────────────────────

func (r *Repository) ListarUsuarios(p ListarUsuariosParams) ([]models.Usuario, int64, error) {
	q := db.GetDB().Model(&models.Usuario{})

	if p.Rol != "" {
		q = q.Where("rol = ?", p.Rol)
	}
	if p.Estado != "" {
		q = q.Where("estado_cuenta = ?", p.Estado)
	}
	if p.Busqueda != "" {
		like := "%" + strings.ToLower(p.Busqueda) + "%"
		q = q.Where(
			"LOWER(nombre) LIKE ? OR LOWER(apellido) LIKE ? OR LOWER(correo_electronico) LIKE ?",
			like, like, like,
		)
	}

	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (p.Pagina - 1) * p.Limite
	var usuarios []models.Usuario
	if err := q.Offset(offset).Limit(p.Limite).Order("creado_en DESC").Find(&usuarios).Error; err != nil {
		return nil, 0, err
	}
	return usuarios, total, nil
}

func (r *Repository) ObtenerPorID(id string) (*models.Usuario, error) {
	var u models.Usuario
	if err := db.GetDB().First(&u, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *Repository) ActualizarRol(id, rol string) error {
	return db.GetDB().Model(&models.Usuario{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{"rol": rol}).Error
}

func (r *Repository) ActualizarEstado(id string, activo bool) error {
	return db.GetDB().Model(&models.Usuario{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{"activo": activo}).Error
}

func (r *Repository) AprobarOrganizador(id string) error {
	res := db.GetDB().Model(&models.Usuario{}).
		Where("id = ? AND rol = 'organizador' AND estado_cuenta = 'pendiente'", id).
		Updates(map[string]interface{}{"estado_cuenta": "activo"})
	if res.Error != nil {
		return res.Error
	}
	return nil
}

// ─── Auditoría ────────────────────────────────────────────────────────────────

func (r *Repository) ListarLogs(f FiltrosAuditoria) ([]models.LogAuditoria, int64, error) {
	q := db.GetDB().Model(&models.LogAuditoria{})

	if f.TipoAccion != "" {
		q = q.Where("accion = ?", f.TipoAccion)
	}
	if f.Usuario != "" {
		like := "%" + strings.ToLower(f.Usuario) + "%"
		q = q.Where("LOWER(correo_usuario) LIKE ? OR CAST(usuario_id AS TEXT) = ?", like, f.Usuario)
	}
	if f.FechaInicio != "" {
		t, err := time.Parse("2006-01-02", f.FechaInicio)
		if err == nil {
			q = q.Where("creado_en >= ?", t)
		}
	}
	if f.FechaFin != "" {
		t, err := time.Parse("2006-01-02", f.FechaFin)
		if err == nil {
			q = q.Where("creado_en < ?", t.Add(24*time.Hour))
		}
	}

	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (f.Pagina - 1) * f.Limite
	var logs []models.LogAuditoria
	if err := q.Offset(offset).Limit(f.Limite).Order("creado_en DESC").Find(&logs).Error; err != nil {
		return nil, 0, err
	}
	return logs, total, nil
}

func (r *Repository) CrearLog(l *models.LogAuditoria) {
	// Silencia errores para que el log nunca bloquee el flujo principal
	db.GetDB().Create(l)
}
