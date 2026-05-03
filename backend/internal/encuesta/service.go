package encuesta

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

func (s *Service) CrearEncuesta(input CrearEncuestaInput) (*EncuestaResponse, error) {
	if input.EventoID == "" || input.Titulo == "" {
		return nil, fiber.NewError(fiber.StatusBadRequest, "evento_id y titulo son requeridos")
	}
	eventoUUID, err := uuid.Parse(input.EventoID)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusBadRequest, "evento_id inválido")
	}
	e := &models.Encuesta{EventoID: eventoUUID, Titulo: input.Titulo, Descripcion: input.Descripcion, Activo: true}
	if err := s.repo.CrearEncuesta(e); err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error creando la encuesta")
	}
	for _, pI := range input.Preguntas {
		p := &models.PreguntaEncuesta{EncuestaID: e.ID, TextoPregunta: pI.TextoPregunta, TipoPregunta: pI.TipoPregunta, Requerido: pI.Requerido, Opciones: pI.Opciones, Orden: pI.Orden}
		if err := s.repo.CrearPregunta(p); err == nil {
			e.Preguntas = append(e.Preguntas, *p)
		}
	}
	return toEncuestaResponse(*e), nil
}

func (s *Service) ObtenerEncuestaPorID(id int64) (*EncuestaResponse, error) {
	e, err := s.repo.BuscarEncuestaPorID(id)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusNotFound, "Encuesta no encontrada")
	}
	return toEncuestaResponse(*e), nil
}

func (s *Service) ListarPorEvento(eventoID string) ([]EncuestaResponse, error) {
	encuestas, err := s.repo.ListarEncuestasPorEvento(eventoID)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error listando encuestas")
	}
	var resp []EncuestaResponse
	for _, e := range encuestas {
		resp = append(resp, *toEncuestaResponse(e))
	}
	return resp, nil
}

func (s *Service) ActualizarEncuesta(id int64, input ActualizarEncuestaInput) (*EncuestaResponse, error) {
	e, err := s.repo.BuscarEncuestaPorID(id)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusNotFound, "Encuesta no encontrada")
	}
	if input.Titulo != nil { e.Titulo = *input.Titulo }
	if input.Descripcion != nil { e.Descripcion = *input.Descripcion }
	if input.Activo != nil { e.Activo = *input.Activo }
	if err := s.repo.ActualizarEncuesta(e); err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error actualizando la encuesta")
	}
	return toEncuestaResponse(*e), nil
}

func (s *Service) EliminarEncuesta(id int64) error {
	if _, err := s.repo.BuscarEncuestaPorID(id); err != nil {
		return fiber.NewError(fiber.StatusNotFound, "Encuesta no encontrada")
	}
	return s.repo.EliminarEncuesta(id)
}

func (s *Service) AgregarPregunta(encuestaID int64, input CrearPreguntaInput) (*PreguntaResponse, error) {
	if input.TextoPregunta == "" || input.TipoPregunta == "" {
		return nil, fiber.NewError(fiber.StatusBadRequest, "texto_pregunta y tipo_pregunta son requeridos")
	}
	if _, err := s.repo.BuscarEncuestaPorID(encuestaID); err != nil {
		return nil, fiber.NewError(fiber.StatusNotFound, "Encuesta no encontrada")
	}
	p := &models.PreguntaEncuesta{EncuestaID: encuestaID, TextoPregunta: input.TextoPregunta, TipoPregunta: input.TipoPregunta, Requerido: input.Requerido, Opciones: input.Opciones, Orden: input.Orden}
	if err := s.repo.CrearPregunta(p); err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error creando la pregunta")
	}
	return toPreguntaResponse(*p), nil
}

func (s *Service) ActualizarPregunta(id int64, input ActualizarPreguntaInput) (*PreguntaResponse, error) {
	p, err := s.repo.BuscarPreguntaPorID(id)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusNotFound, "Pregunta no encontrada")
	}
	if input.TextoPregunta != nil { p.TextoPregunta = *input.TextoPregunta }
	if input.TipoPregunta != nil { p.TipoPregunta = *input.TipoPregunta }
	if input.Requerido != nil { p.Requerido = *input.Requerido }
	if input.Opciones != nil { p.Opciones = *input.Opciones }
	if input.Orden != nil { p.Orden = *input.Orden }
	if err := s.repo.ActualizarPregunta(p); err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error actualizando la pregunta")
	}
	return toPreguntaResponse(*p), nil
}

func (s *Service) EliminarPregunta(id int64) error {
	if _, err := s.repo.BuscarPreguntaPorID(id); err != nil {
		return fiber.NewError(fiber.StatusNotFound, "Pregunta no encontrada")
	}
	return s.repo.EliminarPregunta(id)
}

func (s *Service) EnviarRespuesta(input EnviarRespuestaInput) (*RespuestaEncuestaResponse, error) {
	if len(input.Respuestas) == 0 {
		return nil, fiber.NewError(fiber.StatusBadRequest, "Debe incluir al menos una respuesta")
	}
	enc, err := s.repo.BuscarEncuestaPorID(input.EncuestaID)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusNotFound, "Encuesta no encontrada")
	}
	if !enc.Activo {
		return nil, fiber.NewError(fiber.StatusBadRequest, "La encuesta no está activa")
	}
	re := &models.RespuestaEncuesta{EncuestaID: input.EncuestaID}
	if input.InscripcionID != nil {
		inscUUID, err := uuid.Parse(*input.InscripcionID)
		if err != nil {
			return nil, fiber.NewError(fiber.StatusBadRequest, "inscripcion_id inválido")
		}
		re.InscripcionID = &inscUUID
	}
	if err := s.repo.CrearRespuestaEncuesta(re); err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error guardando la respuesta")
	}
	var respuestas []models.RespuestaPreguntaEncuesta
	for _, rI := range input.Respuestas {
		rp := &models.RespuestaPreguntaEncuesta{RespuestaID: re.ID, PreguntaID: rI.PreguntaID, Respuesta: rI.Respuesta, PuntajeNumerico: rI.PuntajeNumerico}
		if err := s.repo.CrearRespuestaPregunta(rp); err == nil {
			respuestas = append(respuestas, *rp)
		}
	}
	return toRespuestaEncuestaResponse(*re, respuestas), nil
}

func (s *Service) ListarRespuestasPorEncuesta(encuestaID int64) ([]RespuestaEncuestaResponse, error) {
	respuestas, err := s.repo.ListarRespuestasPorEncuesta(encuestaID)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Error listando respuestas")
	}
	var resp []RespuestaEncuestaResponse
	for _, re := range respuestas {
		resp = append(resp, *toRespuestaEncuestaResponse(re, re.Respuestas))
	}
	return resp, nil
}

// ── HELPERS ──────────────────────────────────────────────────────────────────

func toEncuestaResponse(e models.Encuesta) *EncuestaResponse {
	resp := &EncuestaResponse{ID: e.ID, EventoID: e.EventoID.String(), Titulo: e.Titulo, Descripcion: e.Descripcion, Activo: e.Activo, CreadoEn: e.CreadoEn.Format("2006-01-02T15:04:05Z07:00"), ActualizadoEn: e.ActualizadoEn.Format("2006-01-02T15:04:05Z07:00")}
	for _, p := range e.Preguntas {
		resp.Preguntas = append(resp.Preguntas, *toPreguntaResponse(p))
	}
	return resp
}

func toPreguntaResponse(p models.PreguntaEncuesta) *PreguntaResponse {
	return &PreguntaResponse{ID: p.ID, EncuestaID: p.EncuestaID, TextoPregunta: p.TextoPregunta, TipoPregunta: p.TipoPregunta, Requerido: p.Requerido, Opciones: p.Opciones, Orden: p.Orden, CreadoEn: p.CreadoEn.Format("2006-01-02T15:04:05Z07:00")}
}

func toRespuestaEncuestaResponse(re models.RespuestaEncuesta, respuestas []models.RespuestaPreguntaEncuesta) *RespuestaEncuestaResponse {
	resp := &RespuestaEncuestaResponse{ID: re.ID, EncuestaID: re.EncuestaID, EnviadoEn: re.EnviadoEn.Format("2006-01-02T15:04:05Z07:00")}
	if re.InscripcionID != nil {
		iid := re.InscripcionID.String()
		resp.InscripcionID = &iid
	}
	for _, rp := range respuestas {
		resp.Respuestas = append(resp.Respuestas, RespuestaPreguntaResponse{ID: rp.ID, PreguntaID: rp.PreguntaID, Respuesta: rp.Respuesta, PuntajeNumerico: rp.PuntajeNumerico, CreadoEn: rp.CreadoEn.Format("2006-01-02T15:04:05Z07:00")})
	}
	return resp
}
