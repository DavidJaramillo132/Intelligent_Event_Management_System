package admin

import "time"

// ─── Usuarios ─────────────────────────────────────────────────────────────────

type UsuarioAdminItem struct {
	ID                string    `json:"id"`
	Nombre            string    `json:"nombre"`
	Apellido          string    `json:"apellido"`
	CorreoElectronico string    `json:"correo_electronico"`
	Rol               string    `json:"rol"`
	Activo            bool      `json:"activo"`
	EstadoCuenta      string    `json:"estado_cuenta"`
	CreadoEn          time.Time `json:"creado_en"`
}

type ListarUsuariosParams struct {
	Pagina   int
	Limite   int
	Rol      string
	Busqueda string
	Estado   string
}

type ActualizarRolInput struct {
	Rol string `json:"rol"`
}

type ActualizarEstadoInput struct {
	Activo bool `json:"activo"`
}

type PaginatedUsuarios struct {
	Data   []UsuarioAdminItem `json:"data"`
	Total  int64              `json:"total"`
	Pagina int                `json:"pagina"`
	Limite int                `json:"limite"`
}

// ─── Auditoría ────────────────────────────────────────────────────────────────

type LogAuditoriaItem struct {
	ID            uint      `json:"id"`
	UsuarioID     *string   `json:"usuario_id,omitempty"`
	CorreoUsuario string    `json:"correo_usuario"`
	IPAddress     string    `json:"ip_address"`
	Accion        string    `json:"accion"`
	Descripcion   string    `json:"descripcion"`
	CreadoEn      time.Time `json:"creado_en"`
}

type FiltrosAuditoria struct {
	FechaInicio string
	FechaFin    string
	Usuario     string
	TipoAccion  string
	Pagina      int
	Limite      int
}

type PaginatedLogs struct {
	Data   []LogAuditoriaItem `json:"data"`
	Total  int64              `json:"total"`
	Pagina int                `json:"pagina"`
	Limite int                `json:"limite"`
}
