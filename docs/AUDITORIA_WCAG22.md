# Informe de Auditoría WCAG 2.2 Nivel AA — EventosPro

| Campo | Valor |
|-------|-------|
| **Fecha** | 17/06/2026 |
| **Alcance** | Frontend React (`frontend/src/`) |
| **Versión** | 1.0 |

---

## Resumen ejecutivo

| Estado | Criterios |
|--------|-----------|
| ✅ Cumple | 1.1.1, 1.2.1, 1.2.2, 1.3.4, 1.4.2, 1.4.4, 1.4.5, 1.4.13, 2.2.2, 2.3.1 |
| ⚠️ Cumple parcial | 1.4.10, 1.4.12 |
| ❌ No cumple | 1.4.1 (Admin), 1.4.3, 1.4.11, 2.2.1 |
| ⬜ No aplica | 1.2.3, 1.2.4, 1.2.5 |

---

## 1.1.1 Contenido no textual — ✅ Cumple

**Descripción:** Todo contenido no textual tiene alternativa textual equivalente.

| Elemento | Ubicación |
|----------|-----------|
| `alt` en hero | `App.tsx:150` — `"Fondo de gestión de eventos"` |
| `alt` en imágenes "Sobre nosotros" | `App.tsx:273, 278` — `"Conferencia profesional"`, `"Evento de networking corporativo"` |
| `alt` en tarjetas de eventos | `App.tsx:353-354` — `"Portada de {titulo}"` |
| `title` en iframe YouTube | `App.tsx:330` — `"Video corporativo - 25 Aniversario GTT..."` |
| `aria-hidden` en iconos decorativos | `App.tsx:159, 252, 299, 434, 443` |
| `aria-label` en botones sociales | `App.tsx:411, 422` |
| `aria-label` en cerrar alerta | `AlertMessage.tsx:25` |
| `aria-label` en crear usuario | `GestionUsuariosPage.tsx:257` |
| Validación `alt` en portada | `CreateEventPage.tsx:83-84, 306-309` |
| `role="status"` + `sr-only` en spinner | `App.tsx:331` |

---

## 1.2.1 Transcripción — ✅ Cumple

| Elemento | Ubicación |
|----------|-----------|
| `<details>` con transcripción | `App.tsx:337-356` — Texto descriptivo del video + enlace a YouTube con subtítulos |

---

## 1.2.2 Subtítulos — ✅ Cumple

| Elemento | Ubicación |
|----------|-----------|
| Botón CC en YouTube embed | `App.tsx:329` — Subtítulos nativos del reproductor. Mencionados en la transcripción. |

---

## 1.2.3 Audiodescripción (A) — ✅ No aplica

El video es principalmente un discurso sin contenido visual informativo independiente del audio.

| Elemento | Ubicación |
|----------|-----------|
| Justificación documentada | `App.tsx:342` — `"La información visual... es decorativa y no añade contenido adicional al audio principal."` |

---

## 1.2.4 Subtítulos en directo — ⬜ No aplica

No hay transmisiones en vivo. El video es pregrabado.

---

## 1.2.5 Audiodescripción grabada (AA) — ⬜ No aplica

El video no contiene contenido visual informativo sin equivalente auditivo. Documentado en `App.tsx:342`.

---

## 1.3.4 Orientación de pantalla — ✅ Cumple

No hay bloqueo de orientación. La app usa diseño responsive en todas las páginas.

---

## 1.4.1 Uso del color — ❌ No cumple

**Cumple en:**
- `organizer.css:809-822` — Badges de incidencia con emoji + texto ("💬 Informativa", "⚠️ Advertencia", "🚨 Crítica")
- `MonitorPage.tsx:228` — `aria-label="Criticidad: informativa"` en badges

**No cumple en:**
- `GestionUsuarios.css:292-298` — Badges de rol y estado usan solo color (sin icono)
  - `.admin-badge--asistente`, `.admin-badge--organizador`, `.admin-badge--admin`
  - `.admin-badge--estado-activo`, `.admin-badge--estado-pendiente`, `.admin-badge--estado-suspendido`
- `Auditoria.css:211-217` — Badges de acción usan solo color
  - `.audit-badge--login`, `.audit-badge--registro`, `.audit-badge--cambio`
  - `.audit-badge--activacion`, `.audit-badge--desactivacion`, `.audit-badge--aprobacion`

**Acción:** Añadir icono `lucide-react` o texto `sr-only` a cada badge.

---

## 1.4.2 Control de audio — ✅ Cumple

| Elemento | Ubicación |
|----------|-----------|
| Silenciar sonidos Check-in | `AccessibilityMenu.tsx:110` — Toggle; `CheckinPage.tsx:29-43` — `playBeep()` respeta `muteAudio` |
| YouTube sin autoplay | `App.tsx:329` — `src` sin `autoplay=1` |

---

## 1.4.3 Contraste mínimo 4.5:1 — ❌ No cumple

### Tokens globales (`index.css:35-51`)

| Token | Valor | Ratio sobre `#FAFAFA` | ¿Pasa 4.5:1? |
|-------|-------|----------------------|--------------|
| `--color-text` | `#1F2937` | ~12:1 | ✅ |
| `--color-text-secondary` | `#4B5563` | ~3.9:1 | ❌ |
| `--color-text-muted` | `#6B7280` | ~3.3:1 | ❌ |
| Alto contraste forzado | `#000`/`#FFF` | 21:1 | ✅ |

### Hardcoded en Admin CSS

Los archivos `GestionUsuarios.css` y `Auditoria.css` usan colores fijos que no heredan del sistema de variables ni del modo alto contraste:

- `GestionUsuarios.css:292-298` — Badges con colores fijos
- `GestionUsuarios.css:418-420` — Paginación activa `#2563eb` sobre `#fff` (~3.3:1 ❌)
- `Auditoria.css:211-217` — Badges con colores fijos

**Acción:** Oscurecer `--color-text-secondary` a `#374151` y `--color-text-muted` a `#4B5563`. Migrar admin CSS a variables.

---

## 1.4.4 Cambio tamaño texto 200% — ✅ Cumple

| Elemento | Ubicación |
|----------|-----------|
| Opción 200% en menú | `AccessibilityMenu.tsx:89-99` — Radio group con `xxlarge = 200%` |
| CSS class | `index.css:201` — `:root.font-xxlarge { font-size: 200%; }` |

---

## 1.4.5 Imágenes de texto — ✅ Cumple

Todo el contenido textual usa HTML/CSS. No hay imágenes con texto incrustado.

---

## 1.4.10 Reajuste 320px / 400% zoom — ⚠️ Casi cumple

### Lo que funciona

| Elemento | Ubicación | Estado |
|----------|-----------|--------|
| Container responsive | `index.css:441-446` — `max-width: min(72rem, 100% - 2rem)` | ✅ |
| Tabla usuarios → cards | `GestionUsuarios.css:534-567` (768px) | ✅ |
| Tabla auditoría → cards | `Auditoria.css:220-266` (900px) | ✅ |
| Auth responsive | `auth.css:148-164` (380px) | ✅ |
| Overflow-x scroll en tablas | `GestionUsuarios.css:174`, `Auditoria.css:86` | ✅ |

### Pendiente

- Prueba manual a 320px de viewport y 400% zoom en tablas admin
- Breakpoint específico a 320px para tablas (actualmente se rompen)

---

## 1.4.11 Contraste no textual 3:1 — ❌ No cumple

| Elemento | Color | Ratio | ¿Pasa? |
|----------|-------|-------|--------|
| Bordes input admin `#D1D5DB` | `GestionUsuarios.css:153`, `Auditoria.css:64` | ~1.5:1 | ❌ |
| Switch track off `#D1D5DB` | `GestionUsuarios.css:326` | ~1.5:1 | ❌ |
| Badge bg vs fondo `#DBEAFE`/`#FFF` | `GestionUsuarios.css:292-298` | ~1.2:1 | ❌ |
| Focus-visible 3px `--color-primary` | `index.css:291-294` | ~5.5:1 | ✅ |
| Bordes input global `--color-border-strong #636366` | `index.css:323` | ~3.8:1 | ✅ |

**Acción:** Subir bordes `#D1D5DB` → `#9CA3AF` (~3.1:1). Añadir borde visible a badges.

---

## 1.4.12 Espaciado de texto — ⚠️ Casi cumple

### Funciona

- `index.css:204-208` — `.wide-spacing` con `letter-spacing: 0.05em; word-spacing: 0.1em; line-height: 1.8`
- `AccessibilityMenu.tsx:109` — Toggle "Espaciado ampliado"

### Pendiente

- Prueba visual en páginas admin (tienen estilos hardcoded que no heredan variables)

---

## 1.4.13 Contenido al pasar cursor o recibir foco — ✅ Cumple

| Elemento | Ubicación |
|----------|-----------|
| `AccessibleTooltip` | `AccessibleTooltip.tsx` — `role="tooltip"`, `aria-describedby`, cierre con Escape |
| Tooltips en Auditoría | `AuditoriaPage.tsx:246-263` — En timestamps y user IDs |
| Sin `title` nativos | Confirmado: todos reemplazados por `AccessibleTooltip` |

---

## 2.2.1 Tiempo ajustable — ❌ No cumple

### No cumple

- `LoginPage.tsx:39` — `setTimeout(() => navigate('/'), 1000)` sin control de usuario
- `RegisterPage.tsx:67` — `setTimeout(() => navigate('/'), 1500)` sin control de usuario

### Cumple

- `MonitorPage.tsx:107-115` — Botón pausar/reanudar auto-actualización con `aria-pressed`
- `CheckinPage.tsx:266-275` — Botón pausar/reanudar escaneo

**Acción:** Reemplazar auto-redirección en Login/Register por botón "Ir al inicio" manual.

---

## 2.2.2 Pausar, detener, ocultar — ✅ Cumple

| Elemento | Ubicación |
|----------|-----------|
| `reduce-motion` forzado | `index.css:216-227` — `animation-duration: 0.01ms !important` |
| `prefers-reduced-motion` | `index.css:216-222` — Media query |
| Detener cámara Check-in | `CheckinPage.tsx` |
| Pausar escaneo Check-in | `CheckinPage.tsx:266-275` |
| Pausar auto-actualización Monitor | `MonitorPage.tsx:107-115` |

---

## 2.3.1 Tres destellos o menos — ✅ Cumple

Ninguna animación implica cambios rápidos de color/luminosidad:

| Animación | Archivo | Tipo | Segura |
|-----------|---------|------|--------|
| `fadeIn` | `index.css:483-486` | Opacidad + translateY | ✅ |
| `slideUp` | `index.css:487-489` | Opacidad + translateY | ✅ |
| `scanPulse` | `organizer.css:434-437` | Borde con opacidad | ✅ |
| `feedbackPop` | `organizer.css:498-502` | Escala 0.95→1.02 | ✅ |
| `spin` | `auth.css:144` | Rotación continua | ✅ |
| `livePulse` | `organizer.css:604-607` | Opacidad | ✅ |

---

## Mapa por sección de la página

| Sección | Archivo:líneas | Criterios |
|---------|----------------|-----------|
| **Hero** | `App.tsx:146-210` | 1.1.1 (alt fondo, aria-hidden) |
| **Características** | `App.tsx:212-264` | 1.1.1 (aria-hidden iconos), 1.4.1 (icono + texto) |
| **Sobre nosotros** | `App.tsx:267-310` | 1.1.1 (alt imágenes, aria-hidden) |
| **Video destacado** | `App.tsx:312-358` | 1.1.1 (title iframe), 1.2.1 (transcripción), 1.2.2 (CC YouTube), 1.2.3/1.2.5 (documentado), 1.4.2 (sin autoplay) |
| **Escaparate eventos** | `App.tsx:360-439` | 1.1.1 (alt portadas, aria-label), 1.4.1 (icono + texto badges tipo) |
| **Contacto** | `App.tsx:441-503` | 1.1.1 (aria-label redes), 1.3.4 (responsive) |
| **Footer** | `Footer.tsx` | 1.1.1 (aria-hidden) |
| **Menú accesibilidad** | `AccessibilityMenu.tsx` | 1.4.4 (200%), 1.4.12 (espaciado), 1.4.2 (silenciar), 2.2.1 (pausar) |
| **Login** | `LoginPage.tsx` | ❌ 2.2.1 |
| **Register** | `RegisterPage.tsx` | ❌ 2.2.1 |
| **GestionUsuarios** | `GestionUsuariosPage.tsx` + `.css` | ❌ 1.4.1, ❌ 1.4.3, ❌ 1.4.11 |
| **Auditoría** | `AuditoriaPage.tsx` + `.css` | ❌ 1.4.1, ❌ 1.4.3, ❌ 1.4.11, ✅ 1.4.13 |
| **Monitor** | `MonitorPage.tsx` + `organizer.css` | ✅ 1.4.1, ✅ 2.2.1 |
| **Check-in** | `CheckinPage.tsx` | ✅ 1.4.2, ✅ 2.2.1, ✅ 2.2.2 |
| **CreateEvent** | `CreateEventPage.tsx` | ✅ 1.1.1 |

---

## Plan de acción prioritario

| Prioridad | Criterio | Acción | Archivos | Esfuerzo |
|-----------|----------|--------|----------|----------|
| 🔴 Alta | 1.4.3 | Oscurecer `--color-text-secondary` y `--color-text-muted`; migrar admin CSS a variables | `index.css`, `GestionUsuarios.css`, `Auditoria.css` | 2-3h |
| 🔴 Alta | 1.4.11 | Subir bordes `#D1D5DB` → `#9CA3AF`; añadir borde visible a badges | `GestionUsuarios.css`, `Auditoria.css` | 1-2h |
| 🔴 Alta | 2.2.1 | Reemplazar `setTimeout` redirect por botón manual "Ir al inicio" | `LoginPage.tsx`, `RegisterPage.tsx` | 1h |
| 🟡 Media | 1.4.1 | Añadir iconos a badges de Admin y Auditoría | `GestionUsuariosPage.tsx`, `AuditoriaPage.tsx` | 1-2h |
| 🟡 Media | 1.4.10 | Probar 320px y 400% zoom en tablas admin | — | 1h |
| 🟢 Baja | 1.4.12 | Prueba visual con espaciado ampliado en páginas admin | — | 1h |
