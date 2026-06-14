package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"

	"main.go/internal/admin"
	"main.go/internal/checkin"
	"main.go/internal/encuesta"
	"main.go/internal/evento"
	"main.go/internal/ia"
	"main.go/internal/incidencia"
	"main.go/internal/inscripcion"
	"main.go/internal/lugar"
	"main.go/internal/sesion_evento"
	"main.go/internal/tipo_entrada"
	"main.go/internal/tipo_evento"
	"main.go/internal/upload"
	"main.go/internal/usuario"
	"main.go/middleware"
)

// Setup registra todas las rutas de la API sobre la instancia de Fiber.
func Setup(app *fiber.App) {

	// ── CORS ────────────────────────────────────────────────────────────────
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
		AllowHeaders: "Origin,Content-Type,Accept,Authorization",
	}))

	// ── Servir archivos estáticos de uploads ─────────────────────────────────
	app.Static("/uploads", "./uploads")

	// ── Handlers ────────────────────────────────────────────────────────────
	adminH := admin.NewHandler()
	usuarioH := usuario.NewHandler()
	lugarH := lugar.NewHandler()
	tipoEventoH := tipo_evento.NewHandler()
	eventoH := evento.NewHandler()
	inscripcionH := inscripcion.NewHandler()
	checkinH := checkin.NewHandler()
	encuestaH := encuesta.NewHandler()
	iaH := ia.NewHandler()
	uploadH := upload.NewHandler()
	tipoEntradaH := tipo_entrada.NewHandler()
	sesionEventoH := sesion_evento.NewHandler()
	incidenciaH := incidencia.NewHandler()

	// ── Prefijo base ────────────────────────────────────────────────────────
	api := app.Group("/api/v1")

	// ═════════════════════════════════════════════════════════════════════════
	// ── RUTAS PÚBLICAS (sin autenticación) ───────────────────────────────────
	// ═════════════════════════════════════════════════════════════════════════

	// Auth
	auth := api.Group("/auth")
	auth.Post("/register", usuarioH.Register)
	auth.Post("/login", usuarioH.Login)
	auth.Post("/refresh", usuarioH.Refresh)

	// ── Rutas públicas de eventos (sin JWT) ──────────────────────────────────
	publicEventos := api.Group("/eventos")
	publicEventos.Get("/", eventoH.Listar)
	publicEventos.Get("/:id", eventoH.ObtenerPorID)
	publicEventos.Get("/:eventoId/sesiones", sesionEventoH.ListarPorEvento)
	publicEventos.Get("/:eventoId/tipos-entrada", tipoEntradaH.ListarPorEvento)
	publicEventos.Get("/:eventoId/disponibilidad", tipoEntradaH.Disponibilidad)

	// Tipos de evento públicos (para filtros de búsqueda)
	api.Get("/tipos-evento", tipoEventoH.Listar)

	// ═════════════════════════════════════════════════════════════════════════
	// ── RUTAS PROTEGIDAS (requieren JWT) ─────────────────────────────────────
	// ═════════════════════════════════════════════════════════════════════════

	protected := api.Use(middleware.AuthRequired())

	// ── Lugares ─────────────────────────────────────────────────────────────
	lugares := protected.Group("/lugares")
	lugares.Get("/", lugarH.Listar)
	lugares.Get("/:id", lugarH.ObtenerPorID)
	lugares.Post("/", middleware.RolRequerido("organizador", "admin"), lugarH.Crear)
	lugares.Put("/:id", middleware.RolRequerido("organizador", "admin"), lugarH.Actualizar)
	lugares.Delete("/:id", middleware.RolRequerido("admin"), lugarH.Eliminar)

	// ── Tipos de Evento (protegidos: edición) ────────────────────────────────
	tiposEvento := protected.Group("/tipos-evento")
	tiposEvento.Get("/:id", tipoEventoH.ObtenerPorID)
	tiposEvento.Post("/", middleware.RolRequerido("organizador", "admin"), tipoEventoH.Crear)
	tiposEvento.Put("/:id", middleware.RolRequerido("organizador", "admin"), tipoEventoH.Actualizar)
	tiposEvento.Delete("/:id", middleware.RolRequerido("admin"), tipoEventoH.Eliminar)

	// ── Eventos (protegidos: crear/editar/borrar) ─────────────────────────────
	eventos := protected.Group("/eventos")
	eventos.Get("/organizador/:organizadorId", eventoH.ListarPorOrganizador)
	eventos.Get("/:id/stats", eventoH.Stats)
	eventos.Post("/", middleware.RolRequerido("organizador", "admin"), eventoH.Crear)
	eventos.Put("/:id", middleware.RolRequerido("organizador", "admin"), eventoH.Actualizar)
	eventos.Delete("/:id", middleware.RolRequerido("organizador", "admin"), eventoH.Eliminar)

	// ── Tipos de Entrada (sub-recurso de evento, escritura protegida) ────────
	eventos.Post("/:eventoId/tipos-entrada", middleware.RolRequerido("organizador", "admin"), tipoEntradaH.Crear)

	// ── Sesiones de Evento (escritura protegida) ─────────────────────────────
	eventos.Post("/:eventoId/sesiones", middleware.RolRequerido("organizador", "admin"), sesionEventoH.Crear)

	// ── Sesiones (edición/eliminación directa) ──────────────────────────────
	sesiones := protected.Group("/sesiones")
	sesiones.Delete("/:id", middleware.RolRequerido("organizador", "admin"), sesionEventoH.Eliminar)

	// ── Inscripciones ───────────────────────────────────────────────────────
	inscripciones := protected.Group("/inscripciones")
	inscripciones.Post("/", inscripcionH.Crear)
	inscripciones.Get("/:id", inscripcionH.ObtenerPorID)
	inscripciones.Get("/evento/:eventoId", inscripcionH.ListarPorEvento)
	inscripciones.Get("/asistente/:asistenteId", inscripcionH.ListarPorAsistente)
	inscripciones.Patch("/:id/estado", middleware.RolRequerido("organizador", "admin"), inscripcionH.ActualizarEstado)

	// ── Uploads ─────────────────────────────────────────────────────────────
	uploads := protected.Group("/uploads")
	uploads.Post("/", middleware.RolRequerido("organizador", "admin"), uploadH.Subir)

	// ── Materiales de Evento ────────────────────────────────────────────────
	materiales := protected.Group("/materiales")
	materiales.Post("/", middleware.RolRequerido("organizador", "admin"), checkinH.CrearMaterial)
	materiales.Get("/:id", checkinH.ObtenerMaterial)
	materiales.Get("/evento/:eventoId", checkinH.ListarMaterialesPorEvento)
	materiales.Put("/:id", middleware.RolRequerido("organizador", "admin"), checkinH.ActualizarMaterial)
	materiales.Delete("/:id", middleware.RolRequerido("organizador", "admin"), checkinH.EliminarMaterial)

	// ── Incidencias de Evento ────────────────────────────────────────────────
	incidencias := protected.Group("/incidencias")
	incidencias.Post("/", middleware.RolRequerido("organizador", "admin"), incidenciaH.Crear)
	incidencias.Get("/evento/:eventoId", middleware.RolRequerido("organizador", "admin"), incidenciaH.ListarPorEvento)

	// ── Check-ins ───────────────────────────────────────────────────────────
	checkins := protected.Group("/checkins")
	checkins.Post("/", middleware.RolRequerido("organizador", "admin"), checkinH.CrearCheckin)
	checkins.Get("/:id", checkinH.ObtenerCheckin)
	checkins.Get("/evento/:eventoId", checkinH.ListarCheckinsPorEvento)

	// ── Encuestas ───────────────────────────────────────────────────────────
	encuestas := protected.Group("/encuestas")
	encuestas.Get("/:id", encuestaH.ObtenerEncuesta)
	encuestas.Get("/evento/:eventoId", encuestaH.ListarPorEvento)
	encuestas.Post("/", middleware.RolRequerido("organizador", "admin"), encuestaH.CrearEncuesta)
	encuestas.Put("/:id", middleware.RolRequerido("organizador", "admin"), encuestaH.ActualizarEncuesta)
	encuestas.Delete("/:id", middleware.RolRequerido("organizador", "admin"), encuestaH.EliminarEncuesta)
	// Preguntas (sub-recurso de encuesta)
	encuestas.Post("/:id/preguntas", middleware.RolRequerido("organizador", "admin"), encuestaH.AgregarPregunta)
	// Respuestas
	encuestas.Post("/responder", encuestaH.EnviarRespuesta)
	encuestas.Get("/:id/respuestas", encuestaH.ListarRespuestas)

	// ── Preguntas (edición/eliminación directa) ─────────────────────────────
	preguntas := protected.Group("/preguntas")
	preguntas.Put("/:id", middleware.RolRequerido("organizador", "admin"), encuestaH.ActualizarPregunta)
	preguntas.Delete("/:id", middleware.RolRequerido("organizador", "admin"), encuestaH.EliminarPregunta)

	// ── IA (Predicciones + Análisis) ────────────────────────────────────────
	iaGroup := protected.Group("/ia")
	// Predicciones
	iaGroup.Post("/predicciones", middleware.RolRequerido("organizador", "admin"), iaH.CrearPrediccion)
	iaGroup.Get("/predicciones/:id", iaH.ObtenerPrediccion)
	iaGroup.Get("/predicciones/evento/:eventoId", iaH.ListarPrediccionesPorEvento)
	// Análisis de satisfacción
	iaGroup.Post("/analisis", middleware.RolRequerido("organizador", "admin"), iaH.CrearAnalisis)
	iaGroup.Get("/analisis/:id", iaH.ObtenerAnalisis)
	iaGroup.Get("/analisis/evento/:eventoId", iaH.ListarAnalisisPorEvento)
	// Análisis de público
	iaGroup.Post("/publico", middleware.RolRequerido("organizador", "admin"), iaH.CrearPublico)
	iaGroup.Get("/publico/:id", iaH.ObtenerPublico)
	iaGroup.Get("/publico/evento/:eventoId", iaH.ListarPublicoPorEvento)

	// ═════════════════════════════════════════════════════════════════════════
	// ── RUTAS DE ADMINISTRADOR ────────────────────────────────────────────────
	// ═════════════════════════════════════════════════════════════════════════
	adminGroup := protected.Group("/admin", middleware.RolRequerido("admin"))

	// Gestión de usuarios
	adminGroup.Get("/usuarios", adminH.ListarUsuarios)
	adminGroup.Post("/usuarios", adminH.CrearUsuario)
	adminGroup.Patch("/usuarios/:id/rol", adminH.ActualizarRol)
	adminGroup.Patch("/usuarios/:id/estado", adminH.ActualizarEstado)

	// Auditoría
	adminGroup.Get("/auditoria", adminH.ListarLogs)
}
