package checkin

import (
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

// ══════════════════════════════════════════════════════════════════════════════
// ── MATERIALES ───────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

func (s *Service) CrearMaterial(input CrearMaterialInput) (*MaterialResponse, error) {
	if input.EventoID == "" || input.Nombre == "" {
		return nil, fiber.NewError(fiber.StatusBadRequest, "evento_id y nombre son requeridos")
	}

	eventoUUID, err := uuid.Parse(input.EventoID)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusBadRequest, "evento_id inválido")
	}

	cantidad := input.Cantidad
	if cantidad <= 0 {
		cantidad = 1
	}

	m := &models.MaterialEvento{
		EventoID: eventoUUID,
		Nombre:   input.Nombre,
		Cantidad: cantidad,
		Estado:   "pendiente",
		Notas:    input.Notas,
	}

	if err := s.repo.CrearMaterial(m); err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error creando el material")
	}

	return toMaterialResponse(*m), nil
}

func (s *Service) ObtenerMaterialPorID(id string) (*MaterialResponse, error) {
	m, err := s.repo.BuscarMaterialPorID(id)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusNotFound, "Material no encontrado")
	}
	return toMaterialResponse(*m), nil
}

func (s *Service) ListarMaterialesPorEvento(eventoID string) ([]MaterialResponse, error) {
	materiales, err := s.repo.ListarMaterialesPorEvento(eventoID)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error listando materiales")
	}

	var resp []MaterialResponse
	for _, m := range materiales {
		resp = append(resp, *toMaterialResponse(m))
	}
	return resp, nil
}

func (s *Service) ActualizarMaterial(id string, input ActualizarMaterialInput) (*MaterialResponse, error) {
	m, err := s.repo.BuscarMaterialPorID(id)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusNotFound, "Material no encontrado")
	}

	if input.Nombre != nil {
		m.Nombre = *input.Nombre
	}
	if input.Cantidad != nil {
		m.Cantidad = *input.Cantidad
	}
	if input.Estado != nil {
		m.Estado = *input.Estado
	}
	if input.Notas != nil {
		m.Notas = *input.Notas
	}

	if err := s.repo.ActualizarMaterial(m); err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error actualizando el material")
	}

	return toMaterialResponse(*m), nil
}

func (s *Service) EliminarMaterial(id string) error {
	if _, err := s.repo.BuscarMaterialPorID(id); err != nil {
		return fiber.NewError(fiber.StatusNotFound, "Material no encontrado")
	}
	if err := s.repo.EliminarMaterial(id); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Error eliminando el material")
	}
	return nil
}

// ══════════════════════════════════════════════════════════════════════════════
// ── CHECK-INS ────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

func (s *Service) CrearCheckin(input CrearCheckinInput) (*CheckinResponse, error) {
	if input.EventoID == "" || input.InscripcionID == "" || input.BoletoID == "" {
		return nil, fiber.NewError(fiber.StatusBadRequest, "evento_id, inscripcion_id y boleto_id son requeridos")
	}

	if s.repo.ExisteCheckin(input.EventoID, input.InscripcionID) {
		return nil, fiber.NewError(fiber.StatusConflict, "Ya existe un check-in para esta inscripción en este evento")
	}

	eventoUUID, err := uuid.Parse(input.EventoID)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusBadRequest, "evento_id inválido")
	}
	inscripcionUUID, err := uuid.Parse(input.InscripcionID)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusBadRequest, "inscripcion_id inválido")
	}
	boletoUUID, err := uuid.Parse(input.BoletoID)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusBadRequest, "boleto_id inválido")
	}

	c := &models.RegistroCheckin{
		EventoID:      eventoUUID,
		InscripcionID: inscripcionUUID,
		BoletoID:      boletoUUID,
		EstadoAcceso:  "permitido",
		Notas:         input.Notas,
	}

	if input.RevisadoPor != nil {
		revisadoUUID, err := uuid.Parse(*input.RevisadoPor)
		if err != nil {
			return nil, fiber.NewError(fiber.StatusBadRequest, "revisado_por inválido")
		}
		c.RevisadoPor = &revisadoUUID
	}

	if err := s.repo.CrearCheckin(c); err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error registrando el check-in")
	}

	return toCheckinResponse(*c), nil
}

func (s *Service) ObtenerCheckinPorID(id string) (*CheckinResponse, error) {
	c, err := s.repo.BuscarCheckinPorID(id)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusNotFound, "Check-in no encontrado")
	}
	return toCheckinResponse(*c), nil
}

func (s *Service) ListarCheckinsPorEvento(eventoID string) ([]CheckinResponse, error) {
	checkins, err := s.repo.ListarCheckinsPorEvento(eventoID)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error listando check-ins")
	}

	var resp []CheckinResponse
	for _, c := range checkins {
		resp = append(resp, *toCheckinResponse(c))
	}
	return resp, nil
}

// ── HELPERS ──────────────────────────────────────────────────────────────────

func toMaterialResponse(m models.MaterialEvento) *MaterialResponse {
	return &MaterialResponse{
		ID:            m.ID.String(),
		EventoID:      m.EventoID.String(),
		Nombre:        m.Nombre,
		Cantidad:      m.Cantidad,
		Estado:        m.Estado,
		Notas:         m.Notas,
		CreadoEn:      m.CreadoEn.Format("2006-01-02T15:04:05Z07:00"),
		ActualizadoEn: m.ActualizadoEn.Format("2006-01-02T15:04:05Z07:00"),
	}
}

func toCheckinResponse(c models.RegistroCheckin) *CheckinResponse {
	resp := &CheckinResponse{
		ID:            c.ID.String(),
		EventoID:      c.EventoID.String(),
		InscripcionID: c.InscripcionID.String(),
		BoletoID:      c.BoletoID.String(),
		IngresoEn:     c.IngresoEn.Format("2006-01-02T15:04:05Z07:00"),
		EstadoAcceso:  c.EstadoAcceso,
		Notas:         c.Notas,
	}

	if c.RevisadoPor != nil {
		rp := c.RevisadoPor.String()
		resp.RevisadoPor = &rp
	}

	return resp
}
