package usuario

import (
	"main.go/db"
	"main.go/models"
)

type Repository struct{}

func NewRepository() *Repository {
	return &Repository{}
}

func (r *Repository) CrearUsuario(u *models.Usuario) error {
	return db.GetDB().Create(u).Error
}

func (r *Repository) BuscarPorCorreo(correo string) (*models.Usuario, error) {
	var u models.Usuario
	if err := db.GetDB().Where("correo_electronico = ?", correo).First(&u).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *Repository) BuscarPorID(id string) (*models.Usuario, error) {
	var u models.Usuario
	if err := db.GetDB().First(&u, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *Repository) ExisteCorreo(correo string) bool {
	var count int64
	db.GetDB().Model(&models.Usuario{}).Where("correo_electronico = ?", correo).Count(&count)
	return count > 0
}

func (r *Repository) ActualizarPerfil(u *models.Usuario) error {
	return db.GetDB().Model(&models.Usuario{}).
		Where("id = ?", u.ID).
		Updates(map[string]interface{}{
			"nombre":    u.Nombre,
			"telefono":  u.Telefono,
			"ciudad":    u.Ciudad,
			"provincia": u.Provincia,
		}).Error
}

func (r *Repository) ActualizarContrasena(id string, hash string) error {
	return db.GetDB().Model(&models.Usuario{}).
		Where("id = ?", id).
		Update("contrasena_hash", hash).Error
}
