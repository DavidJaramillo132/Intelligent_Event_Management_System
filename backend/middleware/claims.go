package middleware

import "github.com/golang-jwt/jwt/v5"

// Claims personalizados usados por la aplicación
type Claims struct {
	UsuarioID string `json:"usuario_id"`
	Rol       string `json:"rol"`
	jwt.RegisteredClaims
}
