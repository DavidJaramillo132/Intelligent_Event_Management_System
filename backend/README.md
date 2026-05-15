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


### Tablas principales

# 🎪 Eventos API — Backend

API REST para el **Sistema Inteligente de Gestión de Eventos**. Este README se actualizó para reflejar la estructura y la forma de arranque actuales del backend.

---

**Resumen de cambios relevantes**

- Punto de entrada: `cmd/server/main.go` (usar `go run ./cmd/server`)
- Las migraciones no se ejecutan con `AutoMigrate`: el esquema SQL está en `docker/db/init/001_create_tables.sql`.
- La configuración admite `DATABASE_URL` (tiene prioridad) o variables individuales de conexión.

---

## 📦 Tecnologías principales

- Go 1.25.x
- Fiber v2
- GORM (Postgres driver)
- PostgreSQL
- JWT (golang-jwt)
- godotenv

---

## 🔑 Variables de entorno (relevantes)

Crear un archivo `.env` en la raíz de `backend/` o exportar las variables en el entorno.

Opciones de conexión a la DB (se usa `DATABASE_URL` si está definida):

```env
# Opción 1 (URL completa, PRIORIDAD):
# DATABASE_URL=postgres://user:pass@host:5432/dbname?sslmode=disable

# Opción 2 (componentes individuales):
DB_HOST=localhost
DB_PORT=5432
DB_USER=eventos_user
DB_PASSWORD=eventos_pass
DB_NAME=eventos_db
DB_SSLMODE=disable
DB_TIMEZONE=America/Guayaquil

# Pool / timeouts (opcionales)
DB_MAX_OPEN_CONNS=25
DB_MAX_IDLE_CONNS=10
DB_CONN_MAX_LIFETIME=5m

# JWT
JWT_SECRET=tu-super-secreto-cambiar-en-prod
JWT_ACCESS_DURATION=24h
JWT_REFRESH_DURATION=168h

# Server
PORT=8080
APP_ENV=dev      # o 'production'
DEBUG=false
```

---

## 🚀 Inicio rápido (desarrollo)

1. Instalar dependencias y tidy:

```bash
cd backend
go mod tidy
```

2. Levantar PostgreSQL (ejemplo con Docker Compose desde la raíz del repo):

```bash
docker compose -f docker/docker-compose.dev.yml up -d postgres
```

3. Configurar `backend/.env` (ver sección anterior).

4. Ejecutar la API localmente:

```bash
# desde la carpeta backend
go run ./cmd/server
```

---

## 🐳 Usar Docker

Construir la imagen del backend:

```bash
docker build -t eventos-api ./backend
```

Ejecutar (ejemplo, usando `.env`):

```bash
docker run -p 8080:8080 --env-file backend/.env eventos-api
```

---

## 🗄 Migraciones

Las migraciones no se realizan mediante `AutoMigrate`. El esquema SQL inicial se encuentra en `docker/db/init/001_create_tables.sql` y se aplica automáticamente cuando se levanta la base de datos con la configuración Docker del repo.

Si necesita aplicar cambios manuales, ejecute los scripts SQL contra la DB abierta.

---

## 🧭 Rutas principales (resumen)

Base URL: `http://localhost:8080/api/v1`

- Auth (públicas):
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/refresh`

- Endpoints protegidos (usar `Authorization: Bearer <token>`):
  - Lugares: `/api/v1/lugares` (CRUD)
  - Tipos de evento: `/api/v1/tipos-evento` (CRUD)
  - Eventos: `/api/v1/eventos` (CRUD, listar por organizador)
  - Inscripciones: `/api/v1/inscripciones` (crear, listar)
  - Materiales: `/api/v1/materiales` (CRUD)
  - Check-ins: `/api/v1/checkins` (registrar, listar)
  - Encuestas: `/api/v1/encuestas` (crear, responder, listar)
  - IA: `/api/v1/ia` (predicciones y análisis)

Consulte `router/router.go` para el listado completo y las reglas de roles.

---

## Recursos y archivos importantes

- Punto de entrada: [cmd/server/main.go](cmd/server/main.go#L1)
- Rutas: [router/router.go](router/router.go#L1)
- Configuración: [config/config.go](config/config.go#L1)
- Conexión DB: [db/database.go](db/database.go#L1)
- Scripts SQL iniciales: `docker/db/init/001_create_tables.sql`
