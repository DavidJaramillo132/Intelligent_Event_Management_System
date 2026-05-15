package usuario

import (
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

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

// ── MÉTODOS ──────────────────────────────────────────────────────────────────
func (s *Service) Registrar(input RegisterInput) (*AuthResponse, error) {
	// Validaciones
	if input.Nombre == "" || input.Apellido == "" || input.CorreoElectronico == "" || input.Contrasena == "" {
		return nil, fiber.NewError(fiber.StatusBadRequest, "Nombre, apellido, correo y contraseña son requeridos")
	}
	if len(input.Contrasena) < 6 {
		return nil, fiber.NewError(fiber.StatusBadRequest, "La contraseña debe tener al menos 6 caracteres")
	}
	if s.repo.ExisteCorreo(input.CorreoElectronico) {
		return nil, fiber.NewError(fiber.StatusConflict, "El correo ya está registrado")
	}

	// Hashear contraseña
	hash, err := bcrypt.GenerateFromPassword([]byte(input.Contrasena), bcrypt.DefaultCost)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error procesando la contraseña")
	}

	pais := input.Pais
	if pais == "" {
		pais = "Ecuador"
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
		Rol:               "asistente", // siempre asistente al registrarse
	}

	if err := s.repo.CrearUsuario(u); err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error creando el usuario")
	}

	return s.buildAuthResponse(*u)
}

func (s *Service) Login(input LoginInput) (*AuthResponse, error) {
	if input.CorreoElectronico == "" || input.Contrasena == "" {
		return nil, fiber.NewError(fiber.StatusBadRequest, "Correo y contraseña son requeridos")
	}

	u, err := s.repo.BuscarPorCorreo(input.CorreoElectronico)
	if err != nil {
		// mismo mensaje para no revelar si el correo existe o no
		return nil, fiber.NewError(fiber.StatusUnauthorized, "Credenciales incorrectas")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(u.ContrasenaHash), []byte(input.Contrasena)); err != nil {
		return nil, fiber.NewError(fiber.StatusUnauthorized, "Credenciales incorrectas")
	}

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
