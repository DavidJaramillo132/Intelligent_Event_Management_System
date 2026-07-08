package admin

import (
	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
	"main.go/models"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

var rolesValidos = map[string]bool{
	"asistente":   true,
	"organizador": true,
	"admin":       true,
}

// ─── Usuarios ─────────────────────────────────────────────────────────────────

func (s *Service) ListarUsuarios(p ListarUsuariosParams) (*PaginatedUsuarios, error) {
	if p.Limite <= 0 || p.Limite > 100 {
		p.Limite = 20
	}
	if p.Pagina <= 0 {
		p.Pagina = 1
	}

	usuarios, total, err := s.repo.ListarUsuarios(p)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error obteniendo usuarios")
	}

	items := make([]UsuarioAdminItem, len(usuarios))
	for i, u := range usuarios {
		items[i] = toAdminItem(u)
	}
	return &PaginatedUsuarios{
		Data:   items,
		Total:  total,
		Pagina: p.Pagina,
		Limite: p.Limite,
	}, nil
}

func (s *Service) ActualizarRol(adminID, targetID, nuevoRol, ip string) error {
	if !rolesValidos[nuevoRol] {
		return fiber.NewError(fiber.StatusBadRequest, "Rol inválido. Valores permitidos: asistente, organizador, admin")
	}

	target, err := s.repo.ObtenerPorID(targetID)
	if err != nil {
		return fiber.NewError(fiber.StatusNotFound, "Usuario no encontrado")
	}

	if err := s.repo.ActualizarRol(targetID, nuevoRol); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Error actualizando el rol")
	}

	s.repo.CrearLog(&models.LogAuditoria{
		UsuarioID:     &adminID,
		CorreoUsuario: target.CorreoElectronico,
		IPAddress:     ip,
		Accion:        "CAMBIO_ROL",
		Descripcion:   "Rol actualizado de '" + target.Rol + "' a '" + nuevoRol + "' para: " + target.CorreoElectronico,
	})
	return nil
}

func (s *Service) ActualizarEstado(adminID, targetID string, activo bool, ip string) error {
	target, err := s.repo.ObtenerPorID(targetID)
	if err != nil {
		return fiber.NewError(fiber.StatusNotFound, "Usuario no encontrado")
	}

	if err := s.repo.ActualizarEstado(targetID, activo); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Error actualizando el estado")
	}

	accion := "DESACTIVACION"
	if activo {
		accion = "ACTIVACION"
	}
	s.repo.CrearLog(&models.LogAuditoria{
		UsuarioID:     &adminID,
		CorreoUsuario: target.CorreoElectronico,
		IPAddress:     ip,
		Accion:        accion,
		Descripcion:   "Estado de cuenta actualizado para: " + target.CorreoElectronico,
	})
	return nil
}

func (s *Service) CrearUsuario(adminID string, input CrearUsuarioInput, ip string) (*UsuarioAdminItem, error) {
	if input.Nombre == "" || input.Apellido == "" || input.CorreoElectronico == "" || input.Contrasena == "" {
		return nil, fiber.NewError(fiber.StatusBadRequest, "Nombre, apellido, correo y contraseña son requeridos")
	}
	if len(input.Contrasena) < 6 {
		return nil, fiber.NewError(fiber.StatusBadRequest, "La contraseña debe tener al menos 6 caracteres")
	}
	if s.repo.ExisteCorreo(input.CorreoElectronico) {
		return nil, fiber.NewError(fiber.StatusConflict, "El correo ya está registrado")
	}

	rol := "asistente"
	if rolesValidos[input.Rol] {
		rol = input.Rol
	}

	// Hashear contraseña inline para no importar bcrypt aquí, o reusar la de `usuario`...
	// Es mejor importar bcrypt: "golang.org/x/crypto/bcrypt"
	// Lo agregaré en los imports.
	hash, err := bcrypt.GenerateFromPassword([]byte(input.Contrasena), bcrypt.DefaultCost)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error procesando la contraseña")
	}

	u := &models.Usuario{
		Nombre:            input.Nombre,
		Apellido:          input.Apellido,
		CorreoElectronico: input.CorreoElectronico,
		ContrasenaHash:    string(hash),
		Pais:              "Ecuador",
		Rol:               rol,
		Activo:            true,
		EstadoCuenta:      "activo",
	}

	if err := s.repo.CrearUsuario(u); err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error creando el usuario")
	}

	s.repo.CrearLog(&models.LogAuditoria{
		UsuarioID:     &adminID,
		CorreoUsuario: u.CorreoElectronico,
		IPAddress:     ip,
		Accion:        "CREACION_USUARIO",
		Descripcion:   "Administrador creó un usuario: " + u.CorreoElectronico + " (rol: " + rol + ")",
	})

	item := toAdminItem(*u)
	return &item, nil
}

// ─── Auditoría ────────────────────────────────────────────────────────────────

func (s *Service) ListarLogs(f FiltrosAuditoria) (*PaginatedLogs, error) {
	if f.Limite <= 0 || f.Limite > 200 {
		f.Limite = 50
	}
	if f.Pagina <= 0 {
		f.Pagina = 1
	}

	logs, total, err := s.repo.ListarLogs(f)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error obteniendo logs de auditoría")
	}

	items := make([]LogAuditoriaItem, len(logs))
	for i, l := range logs {
		items[i] = toLogItem(l)
	}
	return &PaginatedLogs{
		Data:   items,
		Total:  total,
		Pagina: f.Pagina,
		Limite: f.Limite,
	}, nil
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

func toAdminItem(u models.Usuario) UsuarioAdminItem {
	return UsuarioAdminItem{
		ID:                u.ID.String(),
		Nombre:            u.Nombre,
		Apellido:          u.Apellido,
		CorreoElectronico: u.CorreoElectronico,
		Rol:               u.Rol,
		Activo:            u.Activo,
		EstadoCuenta:      u.EstadoCuenta,
		CreadoEn:          u.CreadoEn,
	}
}

func toLogItem(l models.LogAuditoria) LogAuditoriaItem {
	return LogAuditoriaItem{
		ID:            l.ID,
		UsuarioID:     l.UsuarioID,
		CorreoUsuario: l.CorreoUsuario,
		IPAddress:     l.IPAddress,
		Accion:        l.Accion,
		Descripcion:   l.Descripcion,
		CreadoEn:      l.CreadoEn,
	}
}
