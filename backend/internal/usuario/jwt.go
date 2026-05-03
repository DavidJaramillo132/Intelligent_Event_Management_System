package usuario

import (
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"main.go/middleware"
	"main.go/models"
)

// generarTokens crea access + refresh tokens y devuelve expiresIn en segundos.
func generarTokens(u models.Usuario) (token, refreshToken string, expiresIn int64, err error) {
	secret := []byte(os.Getenv("JWT_SECRET"))
	ahora := time.Now()

	expAccess := ahora.Add(24 * time.Hour)
	expiresIn = int64(time.Until(expAccess).Seconds())

	accessClaims := middleware.Claims{
		UsuarioID: u.ID.String(),
		Rol:       u.Rol,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   u.ID.String(),
			IssuedAt:  jwt.NewNumericDate(ahora),
			ExpiresAt: jwt.NewNumericDate(expAccess),
		},
	}
	token, err = jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims).SignedString(secret)
	if err != nil {
		return
	}

	refreshClaims := middleware.Claims{
		UsuarioID: u.ID.String(),
		Rol:       u.Rol,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   u.ID.String(),
			IssuedAt:  jwt.NewNumericDate(ahora),
			ExpiresAt: jwt.NewNumericDate(ahora.Add(7 * 24 * time.Hour)),
		},
	}
	refreshToken, err = jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims).SignedString(secret)
	return
}
