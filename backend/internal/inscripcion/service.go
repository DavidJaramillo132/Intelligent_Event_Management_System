package inscripcion

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"main.go/models"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// ── MÉTODOS ──────────────────────────────────────────────────────────────────

func (s *Service) Crear(input CrearInscripcionInput) (*InscripcionResponse, error) {
	if input.EventoID == "" || input.AsistenteID == "" {
		return nil, fiber.NewError(fiber.StatusBadRequest, "evento_id y asistente_id son requeridos")
	}

	if s.repo.ExisteInscripcion(input.EventoID, input.AsistenteID) {
		return nil, fiber.NewError(fiber.StatusConflict, "El asistente ya está inscrito en este evento")
	}

	eventoUUID, err := uuid.Parse(input.EventoID)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusBadRequest, "evento_id inválido")
	}
	asistenteUUID, err := uuid.Parse(input.AsistenteID)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusBadRequest, "asistente_id inválido")
	}

	i := &models.Inscripcion{
		EventoID:                    eventoUUID,
		AsistenteID:                 asistenteUUID,
		RequerimientosAccesibilidad: input.RequerimientosAccesibilidad,
		ComprobanteURL:              input.ComprobanteURL,
		Estado:                      "inscrito",
	}

	if err := s.repo.Crear(i); err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error creando la inscripción")
	}

	// Generar boleto automáticamente
	boleto, err := s.generarBoleto(i.ID)
	if err != nil {
		// La inscripción se creó, pero el boleto falló; no es crítico
		return toResponse(*i, nil), nil
	}

	return toResponse(*i, boleto), nil
}

func (s *Service) ObtenerPorID(id string) (*InscripcionResponse, error) {
	i, err := s.repo.BuscarPorID(id)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusNotFound, "Inscripción no encontrada")
	}

	var boleto *models.Boleto
	if i.Boleto != nil {
		boleto = i.Boleto
	}

	return toResponse(*i, boleto), nil
}

func (s *Service) ListarPorEvento(eventoID string) ([]InscripcionResponse, error) {
	inscripciones, err := s.repo.ListarPorEvento(eventoID)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error listando inscripciones")
	}

	var resp []InscripcionResponse
	for _, i := range inscripciones {
		var boleto *models.Boleto
		if i.Boleto != nil {
			boleto = i.Boleto
		}
		resp = append(resp, *toResponse(i, boleto))
	}
	return resp, nil
}

func (s *Service) ListarPorAsistente(asistenteID string) ([]InscripcionResponse, error) {
	inscripciones, err := s.repo.ListarPorAsistente(asistenteID)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error listando inscripciones del asistente")
	}

	var resp []InscripcionResponse
	for _, i := range inscripciones {
		var boleto *models.Boleto
		if i.Boleto != nil {
			boleto = i.Boleto
		}
		resp = append(resp, *toResponse(i, boleto))
	}
	return resp, nil
}

func (s *Service) ActualizarEstado(id string, input ActualizarEstadoInput) (*InscripcionResponse, error) {
	i, err := s.repo.BuscarPorID(id)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusNotFound, "Inscripción no encontrada")
	}

	switch input.Estado {
	case "inscrito", "confirmado", "cancelado":
		i.Estado = input.Estado
	default:
		return nil, fiber.NewError(fiber.StatusBadRequest, "Estado inválido. Valores permitidos: inscrito, confirmado, cancelado")
	}

	ahora := time.Now()
	if input.Estado == "confirmado" {
		i.ConfirmadoEn = &ahora
	}
	if input.Estado == "cancelado" {
		i.CanceladoEn = &ahora
	}

	if err := s.repo.Actualizar(i); err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error actualizando la inscripción")
	}

	var boleto *models.Boleto
	if i.Boleto != nil {
		boleto = i.Boleto
	}

	return toResponse(*i, boleto), nil
}

// ── HELPERS PRIVADOS ─────────────────────────────────────────────────────────

func (s *Service) generarBoleto(inscripcionID uuid.UUID) (*models.Boleto, error) {
	codigo := generarCodigoBoleto()
	qr := fmt.Sprintf("EVENTO-BOLETO-%s", codigo) // placeholder para QR real

	b := &models.Boleto{
		InscripcionID: inscripcionID,
		CodigoBoleto:  codigo,
		CodigoQR:      qr,
		Estado:        "activo",
	}

	if err := s.repo.CrearBoleto(b); err != nil {
		return nil, err
	}
	return b, nil
}

func generarCodigoBoleto() string {
	bytes := make([]byte, 8)
	_, _ = rand.Read(bytes)
	return fmt.Sprintf("BOL-%s", hex.EncodeToString(bytes))
}

func toResponse(i models.Inscripcion, b *models.Boleto) *InscripcionResponse {
	resp := &InscripcionResponse{
		ID:                          i.ID.String(),
		EventoID:                    i.EventoID.String(),
		AsistenteID:                 i.AsistenteID.String(),
		Estado:                      i.Estado,
		RequerimientosAccesibilidad: i.RequerimientosAccesibilidad,
		RegistradoEn:                i.RegistradoEn.Format("2006-01-02T15:04:05Z07:00"),
	}

	if i.ConfirmadoEn != nil {
		t := i.ConfirmadoEn.Format("2006-01-02T15:04:05Z07:00")
		resp.ConfirmadoEn = &t
	}
	if i.CanceladoEn != nil {
		t := i.CanceladoEn.Format("2006-01-02T15:04:05Z07:00")
		resp.CanceladoEn = &t
	}

	if b != nil {
		resp.Boleto = &BoletoResponse{
			ID:            b.ID.String(),
			InscripcionID: b.InscripcionID.String(),
			CodigoBoleto:  b.CodigoBoleto,
			CodigoQR:      b.CodigoQR,
			EmitidoEn:     b.EmitidoEn.Format("2006-01-02T15:04:05Z07:00"),
			Estado:        b.Estado,
		}
	}

	return resp
}
