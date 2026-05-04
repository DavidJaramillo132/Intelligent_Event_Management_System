# 🎪 Eventos API — Backend

API REST para el **Sistema Inteligente de Gestión de Eventos**, construida con **Go**, **Fiber** y **GORM** sobre **PostgreSQL**.

---

## 📑 Tabla de Contenidos

- [Arquitectura](#-arquitectura)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Tecnologías](#-tecnologías)
- [Variables de Entorno](#-variables-de-entorno)
- [Inicio Rápido](#-inicio-rápido)
- [Autenticación y Autorización](#-autenticación-y-autorización)
- [Módulos](#-módulos)
- [Endpoints de la API](#-endpoints-de-la-api)
- [Modelos de Datos](#-modelos-de-datos)
- [Formato de Respuesta](#-formato-de-respuesta)

---

## 🏗 Arquitectura

El backend sigue una **arquitectura modular por dominio** donde cada entidad del negocio se organiza en su propio paquete dentro de `internal/`. Cada módulo se divide en capas:

```
Handler  →  Service  →  Repository  →  DB (GORM)
   ↑            ↑            ↑
  DTO         Lógica      Consultas
              de negocio   a PostgreSQL
```

| Capa           | Responsabilidad                                                    |
| -------------- | ------------------------------------------------------------------ |
| **DTO**        | Estructuras de entrada/salida (request/response)                   |
| **Handler**    | Parsear HTTP, delegar al servicio, devolver JSON                   |
| **Service**    | Validaciones, lógica de negocio, transformaciones                  |
| **Repository** | Acceso a datos mediante GORM (queries, CRUD)                      |
| **JWT**        | Generación de tokens (solo en el módulo `usuario`)                 |

---

## 📁 Estructura del Proyecto

```
backend/
├── main.go                    # Punto de entrada de la aplicación
├── go.mod / go.sum            # Dependencias de Go
├── Dockerfile                 # Imagen Docker del backend
│
├── config/                    # Configuración (futuro)
│
├── db/
│   ├── database.go            # Conexión a PostgreSQL con GORM + pool
│   └── migrate.go             # Migraciones (delegadas al SQL init)
│
├── middleware/
│   ├── claims.go              # Estructura Claims del JWT
│   └── auth.go                # Middlewares: AuthRequired, RolRequerido
│
├── models/                    # Modelos GORM (mapean a tablas SQL)
│   ├── usuario.go             # usuarios
│   ├── lugar.go               # lugares
│   ├── tipo_evento.go         # tipos_evento
│   ├── evento.go              # eventos
│   ├── inscripcion.go         # inscripciones + boletos
│   ├── checkin.go             # materiales_evento + registros_checkin
│   ├── encuesta.go            # encuestas + preguntas + respuestas
│   └── ia.go                  # predicciones_asistencia + analisis_satisfaccion
│
├── router/
│   └── router.go              # Registro centralizado de rutas
│
└── internal/                  # Módulos de dominio
    ├── usuario/               # Autenticación (register, login, refresh)
    │   ├── dto.go
    │   ├── handler.go
    │   ├── jwt.go
    │   ├── repository.go
    │   └── service.go
    │
    ├── lugar/                 # CRUD de sedes/lugares
    │   ├── dto.go
    │   ├── handler.go
    │   ├── repository.go
    │   └── service.go
    │
    ├── tipo_evento/           # CRUD de tipos de evento
    │   ├── dto.go
    │   ├── handler.go
    │   ├── repository.go
    │   └── service.go
    │
    ├── evento/                # CRUD de eventos
    │   ├── dto.go
    │   ├── handler.go
    │   ├── repository.go
    │   └── service.go
    │
    ├── inscripcion/           # Inscripciones + boletos automáticos
    │   ├── dto.go
    │   ├── handler.go
    │   ├── repository.go
    │   └── service.go
    │
    ├── checkin/               # Materiales + registros de ingreso
    │   ├── dto.go
    │   ├── handler.go
    │   ├── repository.go
    │   └── service.go
    │
    ├── encuesta/              # Encuestas, preguntas y respuestas
    │   ├── dto.go
    │   ├── handler.go
    │   ├── repository.go
    │   └── service.go
    │
    └── ia/                    # Predicciones + análisis de satisfacción
        ├── dto.go
        ├── handler.go
        ├── repository.go
        └── service.go
```

---

## 🛠 Tecnologías

| Tecnología                 | Uso                            |
| -------------------------- | ------------------------------ |
| **Go 1.25**                | Lenguaje principal             |
| **Fiber v2**               | Framework HTTP                 |
| **GORM**                   | ORM para PostgreSQL            |
| **PostgreSQL**             | Base de datos relacional       |
| **JWT (golang-jwt/jwt/v5)**| Autenticación stateless        |
| **bcrypt**                 | Hashing de contraseñas         |
| **godotenv**               | Variables de entorno en `.env` |
| **Docker**                 | Contenedorización              |

---

## 🔑 Variables de Entorno

Crear un archivo `.env` en la raíz de `backend/`:

```env
# Base de datos (opción 1: variables individuales)
DB_HOST=localhost
DB_PORT=5432
DB_USER=eventos_user
DB_PASSWORD=eventos_pass
DB_NAME=eventos_db
DB_SSLMODE=disable
DB_TIMEZONE=America/Guayaquil

# O bien (opción 2: URL completa, tiene prioridad)
# DATABASE_URL=postgres://eventos_user:eventos_pass@localhost:5432/eventos_db?sslmode=disable

# JWT
JWT_SECRET=tu_secreto_super_seguro_aqui

# Servidor
PORT=8080
APP_ENV=development
```

---

## 🚀 Inicio Rápido

### Desarrollo local

```bash
# 1. Instalar dependencias
cd backend
go mod tidy

# 2. Levantar PostgreSQL (con Docker)
docker compose up -d postgres

# 3. Configurar .env (ver sección anterior)

# 4. Ejecutar
go run main.go
```

### Con Docker

```bash
docker compose up --build
```

El servidor arranca en `http://localhost:8080`.

### Health Check

```
GET /health
```

```json
{
  "ok": true,
  "service": "eventos-api",
  "time": "2026-05-03T13:00:00-05:00"
}
```

---

## 🔐 Autenticación y Autorización

### JWT (JSON Web Tokens)

El sistema utiliza **access tokens** (24h) y **refresh tokens** (7 días), ambos firmados con HS256.

**Flujo:**

1. `POST /api/v1/auth/register` o `POST /api/v1/auth/login` → devuelve `token` + `refresh_token`
2. Incluir el token en las peticiones protegidas:
   ```
   Authorization: Bearer <token>
   ```
3. Cuando el token expire, usar `POST /api/v1/auth/refresh` con el `refresh_token`

### Roles

| Rol             | Descripción                                    |
| --------------- | ---------------------------------------------- |
| `asistente`     | Rol por defecto al registrarse. Puede inscribirse a eventos, responder encuestas |
| `organizador`   | Puede crear/editar eventos, lugares, materiales, encuestas |
| `admin`         | Acceso total, incluyendo eliminación de recursos |

### Middlewares

| Middleware        | Descripción                                                       |
| ----------------- | ----------------------------------------------------------------- |
| `AuthRequired()`  | Valida el JWT y extrae `usuario_id` y `rol` en `c.Locals()`      |
| `RolRequerido()`  | Verifica que el rol del usuario esté en la lista de roles permitidos |

---

## 📦 Módulos

### 1. Usuario (`internal/usuario`)

Gestiona **autenticación**: registro, login y refresh de tokens.

- Las contraseñas se hashean con **bcrypt**
- Al registrarse, el rol siempre es `asistente`
- Si no se especifica país, se asigna `"Ecuador"` por defecto

### 2. Lugar (`internal/lugar`)

CRUD completo de **sedes/lugares** donde se realizan los eventos.

- Validación de campos obligatorios: nombre, dirección, ciudad, capacidad > 0

### 3. Tipo de Evento (`internal/tipo_evento`)

CRUD de **categorías de evento** (ej: conferencia, taller, seminario).

- El nombre es único (no se permiten duplicados)

### 4. Evento (`internal/evento`)

CRUD de **eventos** con relaciones a organizador, tipo de evento y lugar.

- Valida que la fecha de fin sea posterior a la de inicio
- Estado inicial: `borrador`
- Permite filtrar eventos por organizador
- Preload automático de relaciones (Organizador, TipoEvento, Lugar)

### 5. Inscripción (`internal/inscripcion`)

Gestiona **inscripciones** de asistentes a eventos con **generación automática de boletos**.

- Valida inscripción única por evento+asistente (constraint UNIQUE)
- Al crear una inscripción, se genera un boleto con código único aleatorio
- Estados: `inscrito` → `confirmado` → `cancelado`
- Se registra automáticamente `confirmado_en` y `cancelado_en`

### 6. Check-in (`internal/checkin`)

Dos sub-dominios en un módulo:

- **Materiales de evento**: CRUD de recursos/materiales asignados a un evento
- **Registros de check-in**: Registro de ingreso de asistentes (único por evento+inscripción)

### 7. Encuesta (`internal/encuesta`)

Sistema completo de **encuestas** con tres niveles:

- **Encuesta**: Encuesta vinculada a un evento, con estado activo/inactivo
- **Preguntas**: Tipos: `escala`, `texto`, `opcion_multiple` — con orden configurable
- **Respuestas**: Envío de respuestas completas con puntaje numérico opcional
- Se puede crear la encuesta con preguntas en una sola petición

### 8. IA (`internal/ia`)

Almacena resultados de **modelos de inteligencia artificial**:

- **Predicciones de asistencia**: Cantidad predicha, confianza, versión del modelo
- **Análisis de satisfacción**: Puntaje promedio, sentimiento, puntos positivos/mejora

---

## 🌐 Endpoints de la API

> Base URL: `http://localhost:8080/api/v1`

### Autenticación (Públicas)

| Método | Ruta                 | Descripción              |
| ------ | -------------------- | ------------------------ |
| POST   | `/auth/register`     | Registrar nuevo usuario  |
| POST   | `/auth/login`        | Iniciar sesión           |
| POST   | `/auth/refresh`      | Renovar tokens           |

### Lugares 🔒

| Método | Ruta             | Rol requerido          | Descripción          |
| ------ | ---------------- | ---------------------- | -------------------- |
| GET    | `/lugares`       | cualquiera             | Listar todos         |
| GET    | `/lugares/:id`   | cualquiera             | Obtener por ID       |
| POST   | `/lugares`       | organizador, admin     | Crear lugar          |
| PUT    | `/lugares/:id`   | organizador, admin     | Actualizar lugar     |
| DELETE | `/lugares/:id`   | admin                  | Eliminar lugar       |

### Tipos de Evento 🔒

| Método | Ruta                  | Rol requerido          | Descripción              |
| ------ | --------------------- | ---------------------- | ------------------------ |
| GET    | `/tipos-evento`       | cualquiera             | Listar todos             |
| GET    | `/tipos-evento/:id`   | cualquiera             | Obtener por ID           |
| POST   | `/tipos-evento`       | organizador, admin     | Crear tipo de evento     |
| PUT    | `/tipos-evento/:id`   | organizador, admin     | Actualizar               |
| DELETE | `/tipos-evento/:id`   | admin                  | Eliminar                 |

### Eventos 🔒

| Método | Ruta                                    | Rol requerido          | Descripción                   |
| ------ | --------------------------------------- | ---------------------- | ----------------------------- |
| GET    | `/eventos`                              | cualquiera             | Listar todos                  |
| GET    | `/eventos/:id`                          | cualquiera             | Obtener por ID                |
| GET    | `/eventos/organizador/:organizadorId`   | cualquiera             | Listar por organizador        |
| POST   | `/eventos`                              | organizador, admin     | Crear evento                  |
| PUT    | `/eventos/:id`                          | organizador, admin     | Actualizar evento             |
| DELETE | `/eventos/:id`                          | organizador, admin     | Eliminar evento               |

### Inscripciones 🔒

| Método | Ruta                                       | Rol requerido          | Descripción                    |
| ------ | ------------------------------------------ | ---------------------- | ------------------------------ |
| POST   | `/inscripciones`                           | cualquiera             | Inscribirse (genera boleto)    |
| GET    | `/inscripciones/:id`                       | cualquiera             | Obtener inscripción            |
| GET    | `/inscripciones/evento/:eventoId`          | cualquiera             | Listar por evento              |
| GET    | `/inscripciones/asistente/:asistenteId`    | cualquiera             | Listar por asistente           |
| PATCH  | `/inscripciones/:id/estado`                | organizador, admin     | Cambiar estado                 |

### Materiales 🔒

| Método | Ruta                               | Rol requerido          | Descripción               |
| ------ | ---------------------------------- | ---------------------- | ------------------------- |
| POST   | `/materiales`                      | organizador, admin     | Crear material            |
| GET    | `/materiales/:id`                  | cualquiera             | Obtener material          |
| GET    | `/materiales/evento/:eventoId`     | cualquiera             | Listar por evento         |
| PUT    | `/materiales/:id`                  | organizador, admin     | Actualizar material       |
| DELETE | `/materiales/:id`                  | organizador, admin     | Eliminar material         |

### Check-ins 🔒

| Método | Ruta                              | Rol requerido          | Descripción                |
| ------ | --------------------------------- | ---------------------- | -------------------------- |
| POST   | `/checkins`                       | organizador, admin     | Registrar check-in         |
| GET    | `/checkins/:id`                   | cualquiera             | Obtener check-in           |
| GET    | `/checkins/evento/:eventoId`      | cualquiera             | Listar por evento          |

### Encuestas 🔒

| Método | Ruta                              | Rol requerido          | Descripción                        |
| ------ | --------------------------------- | ---------------------- | ---------------------------------- |
| POST   | `/encuestas`                      | organizador, admin     | Crear encuesta (con preguntas)     |
| GET    | `/encuestas/:id`                  | cualquiera             | Obtener encuesta                   |
| GET    | `/encuestas/evento/:eventoId`     | cualquiera             | Listar por evento                  |
| PUT    | `/encuestas/:id`                  | organizador, admin     | Actualizar encuesta                |
| DELETE | `/encuestas/:id`                  | organizador, admin     | Eliminar encuesta                  |
| POST   | `/encuestas/:id/preguntas`        | organizador, admin     | Agregar pregunta                   |
| POST   | `/encuestas/responder`            | cualquiera             | Enviar respuestas                  |
| GET    | `/encuestas/:id/respuestas`       | cualquiera             | Listar respuestas                  |
| PUT    | `/preguntas/:id`                  | organizador, admin     | Editar pregunta                    |
| DELETE | `/preguntas/:id`                  | organizador, admin     | Eliminar pregunta                  |

### IA 🔒

| Método | Ruta                                         | Rol requerido          | Descripción                    |
| ------ | -------------------------------------------- | ---------------------- | ------------------------------ |
| POST   | `/ia/predicciones`                           | organizador, admin     | Crear predicción               |
| GET    | `/ia/predicciones/:id`                       | cualquiera             | Obtener predicción             |
| GET    | `/ia/predicciones/evento/:eventoId`          | cualquiera             | Listar por evento              |
| POST   | `/ia/analisis`                               | organizador, admin     | Crear análisis                 |
| GET    | `/ia/analisis/:id`                           | cualquiera             | Obtener análisis               |
| GET    | `/ia/analisis/evento/:eventoId`              | cualquiera             | Listar por evento              |

> 🔒 = Requiere header `Authorization: Bearer <token>`

---

## 🗄 Modelos de Datos

### Diagrama ER (simplificado)

```mermaid
erDiagram
    USUARIOS ||--o{ EVENTOS : organiza
    USUARIOS ||--o{ INSCRIPCIONES : se_inscribe
    EVENTOS ||--o{ INSCRIPCIONES : tiene
    EVENTOS }o--|| TIPOS_EVENTO : pertenece
    EVENTOS }o--o| LUGARES : se_realiza_en
    INSCRIPCIONES ||--o| BOLETOS : genera
    EVENTOS ||--o{ MATERIALES_EVENTO : requiere
    EVENTOS ||--o{ REGISTROS_CHECKIN : registra
    INSCRIPCIONES ||--o{ REGISTROS_CHECKIN : valida
    BOLETOS ||--o{ REGISTROS_CHECKIN : verifica
    EVENTOS ||--o{ ENCUESTAS : tiene
    ENCUESTAS ||--o{ PREGUNTAS_ENCUESTA : contiene
    ENCUESTAS ||--o{ RESPUESTAS_ENCUESTA : recibe
    RESPUESTAS_ENCUESTA ||--o{ RESPUESTAS_PREGUNTA : detalla
    EVENTOS ||--o{ PREDICCIONES_ASISTENCIA : predice
    EVENTOS ||--o{ ANALISIS_SATISFACCION : analiza
```

### Tablas principales

| Tabla                          | PK      | Descripción                                    |
| ------------------------------ | ------- | ---------------------------------------------- |
| `usuarios`                     | UUID    | Usuarios del sistema (asistentes, organizadores, admin) |
| `lugares`                      | UUID    | Sedes donde se realizan eventos                |
| `tipos_evento`                 | BIGSERIAL | Categorías de eventos                        |
| `eventos`                      | UUID    | Eventos con fechas, capacidad, costo           |
| `inscripciones`                | UUID    | Registro de asistentes a eventos               |
| `boletos`                      | UUID    | Boletos generados por inscripción              |
| `materiales_evento`            | UUID    | Recursos/materiales de un evento               |
| `registros_checkin`            | UUID    | Registro de ingreso al evento                  |
| `encuestas`                    | BIGSERIAL | Encuestas por evento                         |
| `preguntas_encuesta`           | BIGSERIAL | Preguntas de una encuesta                    |
| `respuestas_encuesta`          | BIGSERIAL | Cabecera de respuestas enviadas              |
| `respuestas_pregunta_encuesta` | BIGSERIAL | Respuesta individual por pregunta            |
| `predicciones_asistencia`      | BIGSERIAL | Predicciones de IA                           |
| `analisis_satisfaccion`        | BIGSERIAL | Análisis de satisfacción por IA              |

---

## 📤 Formato de Respuesta

Todas las respuestas siguen el formato estándar:

### Éxito

```json
{
  "ok": true,
  "data": { ... }
}
```

### Éxito con mensaje

```json
{
  "ok": true,
  "message": "Recurso eliminado correctamente"
}
```

### Error

```json
{
  "ok": false,
  "error": "Descripción del error"
}
```

### Códigos HTTP utilizados

| Código | Significado                                |
| ------ | ------------------------------------------ |
| 200    | OK — operación exitosa                     |
| 201    | Created — recurso creado                   |
| 400    | Bad Request — datos inválidos              |
| 401    | Unauthorized — token inválido/ausente      |
| 403    | Forbidden — rol insuficiente               |
| 404    | Not Found — recurso no encontrado          |
| 409    | Conflict — duplicado (correo, nombre, etc) |
| 500    | Internal Server Error                      |

---

## 📝 Ejemplos de Uso

### Registro

```bash
curl -X POST ttp://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "David",
    "apellido": "Jaramillo",
    "correo_electronico": "david@example.com",
    "contrasena": "mi_password_segura",
    "ciudad": "Quito",
    "pais": "Ecuador"
  }'
```

### Login

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "correo_electronico": "david@example.com",
    "contrasena": "mi_password_segura"
  }'
```

### Crear un evento (requiere token)

```bash
curl -X POST http://localhost:8080/api/v1/eventos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu_token>" \
  -d '{
    "organizador_id": "uuid-del-organizador",
    "tipo_evento_id": 1,
    "titulo": "Tech Summit 2026",
    "descripcion": "Evento de tecnología",
    "inicio": "2026-06-15T09:00:00-05:00",
    "fin": "2026-06-15T18:00:00-05:00",
    "capacidad": 500,
    "costo": 25.00
  }'
```

---

> Desarrollado con ❤️ usando Go + Fiber + GORM
