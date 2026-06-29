package inscripcion

// ── DTOs para el paquete inscripcion ────────────────────────────────────────

type CrearInscripcionInput struct {
	EventoID                    string `json:"evento_id"`
	AsistenteID                 string `json:"asistente_id"`
	TipoEntradaID               string `json:"tipo_entrada_id"`
	RequerimientosAccesibilidad string `json:"requerimientos_accesibilidad,omitempty"`
	ComprobanteURL              string `json:"comprobante_url,omitempty"`
}

type ActualizarEstadoInput struct {
	Estado string `json:"estado"` // inscrito | confirmado | cancelado
}

type InscripcionResponse struct {
	ID                          string          `json:"id"`
	EventoID                    string          `json:"evento_id"`
	AsistenteID                 string          `json:"asistente_id"`
	Estado                      string          `json:"estado"`
	RequerimientosAccesibilidad string          `json:"requerimientos_accesibilidad,omitempty"`
	RegistradoEn                string          `json:"registrado_en"`
	ConfirmadoEn                *string         `json:"confirmado_en,omitempty"`
	CanceladoEn                 *string         `json:"cancelado_en,omitempty"`
	Boleto                      *BoletoResponse `json:"boleto,omitempty"`
}

// ── Boleto DTOs ─────────────────────────────────────────────────────────────

type BoletoResponse struct {
	ID            string `json:"id"`
	InscripcionID string `json:"inscripcion_id"`
	CodigoBoleto  string `json:"codigo_boleto"`
	CodigoQR      string `json:"codigo_qr"`
	EmitidoEn     string `json:"emitido_en"`
	Estado        string `json:"estado"`
}
