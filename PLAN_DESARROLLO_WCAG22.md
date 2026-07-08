# Plan de desarrollo WCAG 2.2 para el sistema web

Este documento organiza las acciones necesarias para desarrollar, reforzar o preparar los criterios WCAG 2.2 visibles en el checklist revisado para el Sistema Inteligente de Gestión de Eventos.

## Alcance

- Frontend: `frontend/`
- Objetivo: Nivel A + AA para los criterios seleccionados.
- Enfoque: implementar mejoras verificables en páginas, formularios y componentes reutilizables.

## Plan por criterio

| Criterio | Estado objetivo | Acción de desarrollo | Ubicación principal |
|---|---|---|---|
| 1.1.1 Contenido no textual | Cumplido | Revisar que toda imagen tenga `alt`, que iconos decorativos usen `aria-hidden="true"` y que botones sin texto tengan `aria-label`. | Inicio, Catálogo, Crear evento, Check-in, Admin |
| 1.2.1 Transcripción audio/video | Preparado | Crear una pauta o componente para mostrar transcripción cuando se agregue audio o video informativo. | Detalle de evento, sesiones, material multimedia |
| 1.2.2 Subtítulos grabados | Preparado | Cuando exista video pregrabado, añadir soporte para `<track kind="captions">` y documentar el formato esperado. | Detalle de evento |
| 1.2.3 Audiodescripción | Preparado | Añadir campo o sección de descripción textual para contenido visual relevante en videos. | Detalle de evento |
| 1.2.4 Subtítulos en directo | Preparado | Si se implementan transmisiones en vivo, integrar subtitulado en tiempo real o proveedor compatible. | Eventos en vivo |
| 1.2.5 Audiodescripción grabada | Preparado | Permitir pista o texto de audiodescripción para videos pregrabados. | Detalle de evento |
| 1.4.1 Uso del color | Cumplido | Asegurar que estados y alertas no dependan solo del color; agregar texto, icono y etiqueta visible. | Admin, Monitor, Check-in, Catálogo |
| 1.4.3 Contraste mínimo | Cumplido | Medir contraste texto/fondo y ajustar colores que no alcancen 4.5:1 en texto normal o 3:1 en texto grande. | Toda la app, especialmente Admin y Auditoría |
| 1.4.4 Cambio de tamaño de texto 200% | Cumplido | Ampliar el menú de accesibilidad para incluir una opción de texto al 200% y corregir desbordes. | Menú de accesibilidad global |
| 1.4.5 Imágenes de texto | Cumplido | Evitar usar imágenes con texto importante; mantener texto real en HTML y solicitar descripción al subir imágenes. | Crear evento, Inicio, Catálogo |
| 1.4.10 Reajuste de elementos | Cumplido | Probar vistas a 320 px y zoom 400%; corregir grids, tablas o tarjetas que generen scroll horizontal innecesario. | Tablas Admin, Reportes, Crear evento, Catálogo |
| 1.4.11 Contraste no textual | Cumplido | Validar contraste de bordes, inputs, iconos, estados, focus rings y gráficas con mínimo 3:1. | Formularios, Monitor, Reportes, Admin |
| 1.4.12 Espaciado de texto | Cumplido | Probar el modo de espaciado ampliado y ajustar componentes que corten, monten o oculten texto. | Toda la app |
| 1.4.13 Contenido al pasar cursor o recibir foco | Cumplido | Crear componente de tooltip accesible que funcione con hover, foco, Escape y contenido persistente. | Catálogo, Monitor, Auditoría, Encuesta |
| 1.3.4 Orientación de la pantalla | Cumplido | Mantener diseño responsive sin bloquear orientación vertical u horizontal. | Toda la app |
| 1.4.2 Control del audio | Cumplido | Agregar preferencia para silenciar sonidos del check-in y persistirla en `localStorage`. | Check-in organizador |
| 2.2.1 Tiempo ajustable | Cumplido | Permitir pausar, extender o configurar mensajes temporales y actualizaciones automáticas. | Monitor, Check-in, Login, Registro |
| 2.2.2 Poner en pausa, detener, ocultar | Cumplido | Añadir controles para pausar actualizaciones automáticas y respetar la preferencia de reducir movimiento. | Monitor, Check-in |
| 2.3.1 Umbral de tres destellos o menos | Cumplido | Revisar animaciones, spinners y pulsos; evitar destellos rápidos y aplicar `prefers-reduced-motion`. | Monitor, Check-in, loaders |

## Prioridad de implementación

### Prioridad alta

1. Agregar opción de tamaño de texto 200% en el menú de accesibilidad.
2. Agregar opción para silenciar audio del check-in.
3. Añadir control para pausar actualizaciones automáticas del Monitor y Check-in.
4. Revisar contraste en Admin, Auditoría, Monitor y Check-in.
5. Reemplazar `title` nativo por tooltips accesibles.

### Prioridad media

1. Probar reflow en móvil y zoom 400%.
2. Corregir tablas con scroll horizontal cuando exista una alternativa responsive viable.
3. Validar contraste no textual de iconos, bordes, gráficas y estados.
4. Probar el modo de espaciado ampliado en todos los formularios.

### Prioridad baja

1. Crear guía para multimedia accesible.
2. Preparar componentes para subtítulos, transcripción y audiodescripción.
3. Documentar criterios que actualmente no aplican porque no hay audio o video pregrabado.

## Tareas técnicas sugeridas

### Menú de accesibilidad

- Archivo: `frontend/src/components/ui/AccessibilityMenu.tsx`
- Archivo: `frontend/src/index.css`
- Agregar opción `200%` o `xxlarge`.
- Añadir preferencia `muteAudio`.
- Añadir preferencia global para pausar actualizaciones o contenido dinámico.
- Persistir todas las preferencias en `localStorage`.

### Check-in

- Archivo: `frontend/src/pages/organizer/CheckinPage.tsx`
- Usar la preferencia `muteAudio` antes de ejecutar `playBeep`.
- Mantener el botón `Detener cámara`.
- Añadir estado visible para indicar si los sonidos están activos o silenciados.
- Permitir pausar escaneo automático si la cámara está activa.

### Monitor en tiempo real

- Archivo: `frontend/src/pages/organizer/MonitorPage.tsx`
- Añadir botón `Pausar actualización`.
- Detener o reactivar el `setInterval` según preferencia del usuario.
- Informar con `aria-live` si la actualización automática está pausada o activa.

### Tooltips accesibles

- Crear componente reutilizable, por ejemplo: `frontend/src/components/ui/AccessibleTooltip.tsx`.
- Debe abrir con hover y foco.
- Debe cerrarse con Escape.
- No debe desaparecer mientras el puntero esté sobre el contenido.
- Debe usar `aria-describedby` cuando aplique.
- Reemplazar usos de `title` en Catálogo, Monitor, Auditoría, Encuesta y Reportes.

### Contraste

- Revisar variables de `frontend/src/index.css`.
- Revisar colores hardcodeados en:
  - `frontend/src/pages/admin/GestionUsuarios.css`
  - `frontend/src/pages/admin/Auditoria.css`
  - `frontend/src/pages/organizer/organizer.css`
  - `frontend/src/pages/attendee/attendee.css`
- Ajustar texto secundario, badges, botones, bordes y focus rings.

### Reflow y espaciado

- Probar con ancho de 320 px.
- Probar zoom 400%.
- Probar clase `wide-spacing`.
- Corregir tarjetas, tablas y formularios que tengan texto cortado o superpuesto.

## Criterios de aceptación

- Todos los formularios mantienen etiquetas visibles o accesibles.
- El foco de teclado siempre es visible.
- La navegación funciona con teclado.
- El texto puede ampliarse hasta 200% sin pérdida de contenido.
- El modo de espaciado ampliado no rompe formularios ni tarjetas.
- Las actualizaciones automáticas pueden pausarse.
- Los sonidos del check-in pueden silenciarse.
- No hay información transmitida solo por color.
- Los tooltips funcionan con teclado y puntero.
- Los criterios multimedia quedan documentados como preparados o no aplicables mientras no exista contenido multimedia.

## Verificación recomendada

1. Ejecutar `npm run build`.
2. Revisar navegación con teclado en Inicio, Catálogo, Crear evento, Inscripción, Check-in, Monitor y Admin.
3. Probar menú de accesibilidad con texto 200%, alto contraste, reducir animaciones y espaciado ampliado.
4. Probar móvil a 320 px.
5. Medir contraste con una herramienta externa o extensión de navegador.
6. Confirmar que los mensajes de estado se anuncian con `role="status"`, `role="alert"` o `aria-live`.
