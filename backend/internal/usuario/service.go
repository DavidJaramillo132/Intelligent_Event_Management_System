package usuario

import (
	"os"
	"regexp"
	"strings"

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

type FieldError struct {
	Status  int
	Field   string
	Message string
}

func (e *FieldError) Error() string {
	return e.Message
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

	// Rol: forzado a asistente en registro público.
	rol := "asistente"
	estadoCuenta := "activo"

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

func (s *Service) ObtenerPerfil(usuarioID string) (*UsuarioPublico, error) {
	u, err := s.repo.BuscarPorID(usuarioID)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusNotFound, "Usuario no encontrado")
	}

	publico := toPublico(*u)
	return &publico, nil
}

func (s *Service) ActualizarPerfil(usuarioID string, input UpdateProfileInput, ip string) (*UsuarioPublico, error) {
	input.Nombre = strings.TrimSpace(input.Nombre)
	input.Telefono = strings.TrimSpace(input.Telefono)
	input.Ciudad = strings.TrimSpace(input.Ciudad)
	input.Provincia = strings.TrimSpace(input.Provincia)

	if input.Nombre == "" {
		return nil, &FieldError{Status: fiber.StatusBadRequest, Field: "nombre", Message: "El nombre de usuario es requerido"}
	}
	if len(input.Nombre) > 100 {
		return nil, &FieldError{Status: fiber.StatusBadRequest, Field: "nombre", Message: "El nombre no puede superar 100 caracteres"}
	}
	if input.Telefono == "" {
		return nil, &FieldError{Status: fiber.StatusBadRequest, Field: "telefono", Message: "El telefono es requerido"}
	}
	if !regexp.MustCompile(`^[0-9+()\-\s]{7,30}$`).MatchString(input.Telefono) {
		return nil, &FieldError{Status: fiber.StatusBadRequest, Field: "telefono", Message: "Ingresa un telefono valido"}
	}
	if input.Ciudad == "" {
		return nil, &FieldError{Status: fiber.StatusBadRequest, Field: "ciudad", Message: "La ciudad es requerida"}
	}
	if len(input.Ciudad) > 100 {
		return nil, &FieldError{Status: fiber.StatusBadRequest, Field: "ciudad", Message: "La ciudad no puede superar 100 caracteres"}
	}
	if input.Provincia == "" {
		return nil, &FieldError{Status: fiber.StatusBadRequest, Field: "provincia", Message: "La provincia es requerida"}
	}
	if len(input.Provincia) > 100 {
		return nil, &FieldError{Status: fiber.StatusBadRequest, Field: "provincia", Message: "La provincia no puede superar 100 caracteres"}
	}

	u, err := s.repo.BuscarPorID(usuarioID)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusNotFound, "Usuario no encontrado")
	}

	u.Nombre = input.Nombre
	u.Telefono = input.Telefono
	u.Ciudad = input.Ciudad
	u.Provincia = input.Provincia

	if err := s.repo.ActualizarPerfil(u); err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error actualizando el perfil")
	}

	registrarLog(&usuarioID, u.CorreoElectronico, ip, "ACTUALIZAR_PERFIL", "Perfil actualizado")

	publico := toPublico(*u)
	return &publico, nil
}

func (s *Service) CambiarContrasena(usuarioID string, input ChangePasswordInput, ip string) error {
	if input.ContrasenaActual == "" {
		return &FieldError{Status: fiber.StatusBadRequest, Field: "contrasena_actual", Message: "La contrasena actual es requerida"}
	}
	if input.NuevaContrasena == "" {
		return &FieldError{Status: fiber.StatusBadRequest, Field: "nueva_contrasena", Message: "La nueva contrasena es requerida"}
	}
	if !esContrasenaFuerte(input.NuevaContrasena) {
		return &FieldError{Status: fiber.StatusBadRequest, Field: "nueva_contrasena", Message: "Usa al menos 8 caracteres con mayuscula, minuscula, numero y simbolo"}
	}
	if input.NuevaContrasena != input.ConfirmarContrasena {
		return &FieldError{Status: fiber.StatusBadRequest, Field: "confirmar_contrasena", Message: "Las contrasenas no coinciden"}
	}

	u, err := s.repo.BuscarPorID(usuarioID)
	if err != nil {
		return fiber.NewError(fiber.StatusNotFound, "Usuario no encontrado")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(u.ContrasenaHash), []byte(input.ContrasenaActual)); err != nil {
		return &FieldError{Status: fiber.StatusUnauthorized, Field: "contrasena_actual", Message: "La contrasena actual es incorrecta"}
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.NuevaContrasena), bcrypt.DefaultCost)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Error procesando la contrasena")
	}

	if err := s.repo.ActualizarContrasena(usuarioID, string(hash)); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Error actualizando la contrasena")
	}

	registrarLog(&usuarioID, u.CorreoElectronico, ip, "CAMBIO_CONTRASENA", "Contrasena actualizada")
	return nil
}

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

func esContrasenaFuerte(contrasena string) bool {
	return len(contrasena) >= 8 &&
		regexp.MustCompile(`[a-z]`).MatchString(contrasena) &&
		regexp.MustCompile(`[A-Z]`).MatchString(contrasena) &&
		regexp.MustCompile(`[0-9]`).MatchString(contrasena) &&
		regexp.MustCompile(`[^A-Za-z0-9]`).MatchString(contrasena)
}
