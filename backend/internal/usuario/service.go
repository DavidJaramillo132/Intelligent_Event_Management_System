package usuario

import (
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"main.go/db"
	"main.go/middleware"
	"main.go/models"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// DTOs moved to dto.go

// ── HELPERS DE AUDITORÍA ──────────────────────────────────────────────────────

func registrarLog(usuarioID *string, correo, ip, accion, descripcion string) {
	l := models.LogAuditoria{
		UsuarioID:     usuarioID,
		CorreoUsuario: correo,
		IPAddress:     ip,
		Accion:        accion,
		Descripcion:   descripcion,
	}
	db.GetDB().Create(&l) // silencia errores para no bloquear el flujo principal
}

// ── MÉTODOS ───────────────────────────────────────────────────────────────────

// Registrar crea un usuario. Para organizadores devuelve (nil, nil) indicando
// que la cuenta queda pendiente de aprobación por un administrador.
func (s *Service) Registrar(input RegisterInput, ip string) (*AuthResponse, error) {
	if input.Nombre == "" || input.Apellido == "" || input.CorreoElectronico == "" || input.Contrasena == "" {
		return nil, fiber.NewError(fiber.StatusBadRequest, "Nombre, apellido, correo y contraseña son requeridos")
	}
	if len(input.Contrasena) < 6 {
		return nil, fiber.NewError(fiber.StatusBadRequest, "La contraseña debe tener al menos 6 caracteres")
	}
	if s.repo.ExisteCorreo(input.CorreoElectronico) {
		return nil, fiber.NewError(fiber.StatusConflict, "El correo ya está registrado")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.Contrasena), bcrypt.DefaultCost)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error procesando la contraseña")
	}

	pais := input.Pais
	if pais == "" {
		pais = "Ecuador"
	}

	// Rol: whitelist. Nunca admin por auto-registro.
	// Los organizadores quedan en estado "pendiente" hasta aprobación del admin.
	rol := "asistente"
	estadoCuenta := "activo"
	if input.Rol == "organizador" {
		rol = "organizador"
		estadoCuenta = "pendiente"
	}

	u := &models.Usuario{
		Nombre:            input.Nombre,
		Apellido:          input.Apellido,
		CorreoElectronico: input.CorreoElectronico,
		ContrasenaHash:    string(hash),
		Telefono:          input.Telefono,
		Ciudad:            input.Ciudad,
		Provincia:         input.Provincia,
		Pais:              pais,
		Rol:               rol,
		Activo:            true,
		EstadoCuenta:      estadoCuenta,
	}

	if err := s.repo.CrearUsuario(u); err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error creando el usuario")
	}

	uid := u.ID.String()
	registrarLog(&uid, u.CorreoElectronico, ip, "REGISTRO",
		"Nuevo usuario registrado: "+u.CorreoElectronico+" (rol: "+rol+")")

	// Organizadores pendientes no reciben token
	if estadoCuenta == "pendiente" {
		return nil, nil
	}

	return s.buildAuthResponse(*u)
}

func (s *Service) Login(input LoginInput, ip string) (*AuthResponse, error) {
	if input.CorreoElectronico == "" || input.Contrasena == "" {
		return nil, fiber.NewError(fiber.StatusBadRequest, "Correo y contraseña son requeridos")
	}

	u, err := s.repo.BuscarPorCorreo(input.CorreoElectronico)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusUnauthorized, "Credenciales incorrectas")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(u.ContrasenaHash), []byte(input.Contrasena)); err != nil {
		return nil, fiber.NewError(fiber.StatusUnauthorized, "Credenciales incorrectas")
	}

	// Verificar estado de la cuenta
	if !u.Activo {
		return nil, fiber.NewError(fiber.StatusForbidden, "Tu cuenta ha sido desactivada. Contacta al administrador.")
	}
	if u.EstadoCuenta == "pendiente" {
		return nil, fiber.NewError(fiber.StatusForbidden, "Tu cuenta está pendiente de aprobación por un administrador.")
	}

	uid := u.ID.String()
	registrarLog(&uid, u.CorreoElectronico, ip, "LOGIN",
		"Inicio de sesión: "+u.CorreoElectronico)

	return s.buildAuthResponse(*u)
}

func (s *Service) Refresh(refreshToken string) (*AuthResponse, error) {
	if refreshToken == "" {
		return nil, fiber.NewError(fiber.StatusBadRequest, "refresh_token requerido")
	}

	secret := []byte(os.Getenv("JWT_SECRET"))
	token, err := jwt.ParseWithClaims(refreshToken, &middleware.Claims{}, func(t *jwt.Token) (interface{}, error) {
		return secret, nil
	})
	if err != nil || !token.Valid {
		return nil, fiber.NewError(fiber.StatusUnauthorized, "Refresh token inválido o expirado")
	}

	claims, ok := token.Claims.(*middleware.Claims)
	if !ok {
		return nil, fiber.NewError(fiber.StatusUnauthorized, "Claims inválidos")
	}

	// Buscar usuario actualizado (por si cambió el rol)
	u, err := s.repo.BuscarPorID(claims.UsuarioID)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusUnauthorized, "Usuario no encontrado")
	}

	return s.buildAuthResponse(*u)
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

func (s *Service) buildAuthResponse(u models.Usuario) (*AuthResponse, error) {
	token, refreshToken, expiresIn, err := generarTokens(u)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error generando el token")
	}

	return &AuthResponse{
		Token:        token,
		RefreshToken: refreshToken,
		ExpiresIn:    expiresIn,
		Usuario:      toPublico(u),
	}, nil
}

func toPublico(u models.Usuario) UsuarioPublico {
	return UsuarioPublico{
		ID:                u.ID.String(),
		Nombre:            u.Nombre,
		Apellido:          u.Apellido,
		CorreoElectronico: u.CorreoElectronico,
		Rol:               u.Rol,
		Ciudad:            u.Ciudad,
		Provincia:         u.Provincia,
		Pais:              u.Pais,
		Telefono:          u.Telefono,
	}
}
