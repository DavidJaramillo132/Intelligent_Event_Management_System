package usuario

// DTOs para el paquete usuario
type RegisterInput struct {
	Nombre            string `json:"nombre"`
	Apellido          string `json:"apellido"`
	CorreoElectronico string `json:"correo_electronico"`
	Contrasena        string `json:"contrasena"`
	Telefono          string `json:"telefono"`
	Ciudad            string `json:"ciudad"`
	Provincia         string `json:"provincia"`
	Pais              string `json:"pais"`
	Rol               string `json:"rol"`
}

type LoginInput struct {
	CorreoElectronico string `json:"correo_electronico"`
	Contrasena        string `json:"contrasena"`
}

type AuthResponse struct {
	Token        string         `json:"token"`
	RefreshToken string         `json:"refresh_token"`
	ExpiresIn    int64          `json:"expires_in"`
	Usuario      UsuarioPublico `json:"usuario"`
}

type UsuarioPublico struct {
	ID                string `json:"id"`
	Nombre            string `json:"nombre"`
	Apellido          string `json:"apellido"`
	CorreoElectronico string `json:"correo_electronico"`
	Rol               string `json:"rol"`
	Ciudad            string `json:"ciudad,omitempty"`
	Provincia         string `json:"provincia,omitempty"`
	Pais              string `json:"pais"`
	Telefono          string `json:"telefono,omitempty"`
}
