package middleware

import (
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

// AuthRequired valida el JWT en la cabecera Authorization: Bearer <token>.
// Si es válido, inyecta usuario_id y rol en c.Locals.
func AuthRequired() fiber.Handler {
	return func(c *fiber.Ctx) error {
		header := c.Get("Authorization")
		if header == "" {
			return fiber.NewError(fiber.StatusUnauthorized, "Token de autorización requerido")
		}

		parts := strings.SplitN(header, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			return fiber.NewError(fiber.StatusUnauthorized, "Formato de autorización inválido. Use: Bearer <token>")
		}

		tokenStr := parts[1]
		secret := []byte(os.Getenv("JWT_SECRET"))

		token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
			return secret, nil
		})
		if err != nil || !token.Valid {
			return fiber.NewError(fiber.StatusUnauthorized, "Token inválido o expirado")
		}

		claims, ok := token.Claims.(*Claims)
		if !ok {
			return fiber.NewError(fiber.StatusUnauthorized, "Claims inválidos")
		}

		// Inyectar datos del usuario en el contexto
		c.Locals("usuario_id", claims.UsuarioID)
		c.Locals("rol", claims.Rol)

		return c.Next()
	}
}

// RolRequerido verifica que el usuario tenga uno de los roles permitidos.
func RolRequerido(roles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		rol, _ := c.Locals("rol").(string)
		for _, r := range roles {
			if r == rol {
				return c.Next()
			}
		}
		return fiber.NewError(fiber.StatusForbidden, "No tiene permisos para acceder a este recurso")
	}
}
