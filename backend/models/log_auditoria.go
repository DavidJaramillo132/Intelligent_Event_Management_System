package models

import "time"

// LogAuditoria registra las acciones críticas del sistema para trazabilidad.
type LogAuditoria struct {
	ID            uint      `gorm:"primaryKey;autoIncrement"                  json:"id"`
	UsuarioID     *string   `gorm:"type:uuid;index"                           json:"usuario_id,omitempty"`
	CorreoUsuario string    `gorm:"type:varchar(150);not null;default:'';index" json:"correo_usuario"`
	IPAddress     string    `gorm:"type:varchar(45);not null;default:''"      json:"ip_address"`
	Accion        string    `gorm:"type:varchar(50);not null;index"           json:"accion"`
	Descripcion   string    `gorm:"type:text"                                 json:"descripcion"`
	CreadoEn      time.Time `gorm:"autoCreateTime;index"                      json:"creado_en"`
}

func (LogAuditoria) TableName() string {
	return "logs_auditoria"
}
