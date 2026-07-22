# Requirements Document

## Introduction

Este documento especifica los requisitos para el sistema de gestión de sesión con detección de inactividad del frontend del **Intelligent Event Management System**. El sistema detecta cuando un usuario autenticado lleva un período configurable sin interacción, le muestra una advertencia con cuenta regresiva y, si no responde, cierra la sesión automáticamente. El sistema cumple con el criterio de éxito WCAG 2.2.1 (Ajuste de tiempo): el usuario puede extender el tiempo con una acción simple, la advertencia aparece al menos 20 segundos antes del cierre y la función puede desactivarse desde el menú de accesibilidad.

El codebase ya contiene implementaciones parciales de `sessionTimer.ts`, `SessionExpiryModal.tsx` y `AuthContext.tsx`. Estos requisitos formalizan el comportamiento completo esperado, cubriendo los casos no tratados o incompletos en la implementación actual.

---

## Glossary

- **Session_Timer**: Módulo encargado de detectar la inactividad del usuario y disparar las callbacks de advertencia y expiración (`sessionTimer.ts`).
- **Auth_Context**: Proveedor de contexto React que gestiona el estado de autenticación y coordina el ciclo de vida del `Session_Timer` (`AuthContext.tsx`).
- **Expiry_Modal**: Modal de advertencia que informa al usuario de la expiración inminente de su sesión y ofrece opciones de acción (`SessionExpiryModal.tsx`).
- **Accessibility_Menu**: Panel de preferencias de accesibilidad que permite personalizar el comportamiento de la aplicación, incluido el tiempo de sesión (`AccessibilityMenu.tsx`).
- **A11y_Prefs**: Objeto de preferencias de accesibilidad persistido en `localStorage` bajo la clave `a11y-prefs`.
- **Inactivity_Period**: Duración sin eventos de usuario (click, teclado, scroll, touch, wheel) tras la cual se inicia la secuencia de advertencia. Valor por defecto: 15 minutos.
- **Warning_Window**: Período durante el cual el `Expiry_Modal` está visible y el usuario puede actuar. Duración fija: 60 segundos.
- **JWT_Token**: Token de autenticación almacenado en `localStorage` bajo la clave `auth`.
- **Activity_Event**: Cualquiera de los eventos del navegador `mousedown`, `keydown`, `touchstart`, `scroll` o `wheel` que indica actividad del usuario.

---

## Requirements

### Requirement 1: Detección de inactividad del usuario

**User Story:** Como usuario autenticado, quiero que el sistema detecte cuándo he estado inactivo durante un período prolongado, para que mi sesión no quede abierta de forma inadvertida en dispositivos compartidos.

#### Acceptance Criteria

1. WHEN el usuario se autentica exitosamente, THE Session_Timer SHALL iniciar el seguimiento de inactividad registrando escuchas de Activity_Events sobre la ventana activa de la aplicación.
2. WHEN se recibe un Activity_Event, IF el Warning_Window no está activo, THE Session_Timer SHALL reiniciar el contador de inactividad desde cero.
3. WHEN el usuario cierra sesión, THE Session_Timer SHALL detener el seguimiento y eliminar todos los registros de escucha de Activity_Events activos.
4. THE Session_Timer SHALL soportar un Inactivity_Period configurable expresado en minutos enteros en el rango [1, 480], con un valor por defecto de 15 minutos.
5. WHILE el Warning_Window está activo, THE Session_Timer SHALL ignorar los Activity_Events y no reiniciar el contador de inactividad.
6. IF el Inactivity_Period configurado está fuera del rango [1, 480] o no es un entero válido, THEN THE Session_Timer SHALL rechazar el valor, mantener el período anterior (o el valor por defecto si no había uno previo) y señalar el error al configurador.

---

### Requirement 2: Advertencia de expiración de sesión

**User Story:** Como usuario autenticado, quiero recibir una advertencia visible antes de que mi sesión expire, para tener la oportunidad de extenderla sin perder mi trabajo.

#### Acceptance Criteria

1. WHEN el Inactivity_Period de 15 minutos transcurre sin Activity_Events, THE Auth_Context SHALL mostrar el Expiry_Modal con el Warning_Window activo.
2. WHILE el Expiry_Modal está visible, THE Expiry_Modal SHALL mostrar una cuenta regresiva en segundos que inicia en 60 y decrementa en 1 cada segundo.
3. WHILE el Expiry_Modal está visible, THE Expiry_Modal SHALL anunciar el tiempo restante mediante un elemento con `aria-live="polite"` y `aria-atomic="true"` cada 10 segundos para lectores de pantalla.
4. WHEN el Expiry_Modal se monta, THE Expiry_Modal SHALL recibir el foco automáticamente en el botón "Extender sesión", de modo que un usuario de teclado pueda actuar con una sola pulsación.
5. WHILE el Expiry_Modal está visible, THE Expiry_Modal SHALL presentarse con `role="alertdialog"`, `aria-modal="true"`, título referenciado con `aria-labelledby` y descripción referenciada con `aria-describedby`.
6. WHEN el Warning_Window inicia, IF quedan menos de 60 segundos antes del cierre automático, THEN THE Auth_Context SHALL extender el tiempo hasta garantizar exactamente 60 segundos de advertencia, cumpliendo el requisito WCAG 2.2.1.
7. WHEN la cuenta regresiva llega a 0, THE Auth_Context SHALL ejecutar el cierre de sesión automático.
8. WHEN el usuario activa el botón "Extender sesión" en el Expiry_Modal, THE Auth_Context SHALL cerrar el Expiry_Modal y reiniciar el Inactivity_Period desde cero.

---

### Requirement 3: Extensión de sesión

**User Story:** Como usuario autenticado, quiero poder extender mi sesión con una acción simple, para continuar trabajando sin interrupciones cuando recibo la advertencia.

#### Acceptance Criteria

1. WHEN el usuario activa el botón "Extender sesión" en el Expiry_Modal, THE Auth_Context SHALL: (a) cerrar el Expiry_Modal, (b) cancelar el temporizador de expiración activo, (c) marcar el Warning_Window como inactivo, y (d) reiniciar el contador de inactividad para el Inactivity_Period completo configurado.
2. WHEN el usuario hace clic en el área de fondo (overlay) del Expiry_Modal fuera del panel, THE Auth_Context SHALL: (a) cerrar el Expiry_Modal, (b) cancelar el temporizador de expiración activo, (c) marcar el Warning_Window como inactivo, y (d) reiniciar el contador de inactividad para el Inactivity_Period completo configurado.
3. WHEN la sesión se extiende, THE Session_Timer SHALL marcar el Warning_Window como inactivo, re-registrar los escuchas de Activity_Events si fueron eliminados, y reiniciar el contador de inactividad desde cero para el Inactivity_Period completo configurado.

---

### Requirement 4: Cierre de sesión automático por inactividad

**User Story:** Como usuario autenticado, quiero que la sesión se cierre automáticamente si no respondo a la advertencia, para proteger mis datos en dispositivos no supervisados.

#### Acceptance Criteria

1. WHEN el Warning_Window expira sin que el usuario haya extendido la sesión, THE Auth_Context SHALL ejecutar el proceso de logout en este orden: (a) ocultar el Expiry_Modal, (b) detener el Session_Timer, (c) eliminar el JWT_Token de `localStorage`, (d) establecer `user` y `token` en el estado React a `null`.
2. WHEN el usuario activa el botón "Cerrar sesión ahora" en el Expiry_Modal, THE Auth_Context SHALL ejecutar el mismo proceso de logout descrito en el criterio 1 en un plazo máximo de 1 segundo.
3. WHEN el logout completa, THE Auth_Context SHALL redirigir al usuario a la página de login.
4. IF el JWT_Token no puede eliminarse de `localStorage` por un error del navegador, THEN THE Auth_Context SHALL establecer `user` y `token` a `null` en el estado React y tratar al usuario como desautenticado, continuando el flujo sin interrupción.

---

### Requirement 5: Desactivación del tiempo de sesión (accesibilidad)

**User Story:** Como usuario con necesidades de accesibilidad, quiero poder desactivar el límite de tiempo de sesión, para poder interactuar con la aplicación a mi propio ritmo sin riesgo de perder mi trabajo (WCAG 2.2.1).

#### Acceptance Criteria

1. THE Accessibility_Menu SHALL presentar un toggle con etiqueta "Tiempo de sesión ilimitado" que controla la propiedad `noSessionTimeout` de A11y_Prefs.
2. WHEN el usuario activa el toggle "Tiempo de sesión ilimitado", THE Auth_Context SHALL detener el Session_Timer y ocultar el Expiry_Modal si estuviera visible.
3. WHEN el usuario desactiva el toggle "Tiempo de sesión ilimitado" y existe un JWT_Token en `localStorage`, THE Auth_Context SHALL reiniciar el Session_Timer con el Inactivity_Period de 15 minutos y la Warning_Window de 60 segundos.
4. WHEN la aplicación carga y A11y_Prefs contiene `noSessionTimeout: true`, THE Auth_Context SHALL omitir el inicio del Session_Timer aunque exista JWT_Token en `localStorage`.
5. WHEN el usuario restablece las preferencias de accesibilidad al valor por defecto, THE Accessibility_Menu SHALL asignar `noSessionTimeout: false` y THE Auth_Context SHALL reiniciar el Session_Timer si existe JWT_Token en `localStorage`.
6. WHEN el valor de `noSessionTimeout` cambia, THE Accessibility_Menu SHALL persistir el nuevo valor de A11y_Prefs en `localStorage` bajo la clave `a11y-prefs` de forma síncrona y despachar un CustomEvent `a11y-prefs-changed` en `window`.

---

### Requirement 6: Persistencia y sincronización entre pestañas

**User Story:** Como usuario que trabaja con múltiples pestañas, quiero que el estado de sesión sea consistente entre ellas, para que una acción en una pestaña se refleje en las demás.

#### Acceptance Criteria

1. WHEN el evento `storage` indica que el JWT_Token fue eliminado (`newValue === null`) en otra pestaña, THE Auth_Context SHALL detener el Session_Timer, ocultar el Expiry_Modal si estuviera visible, y establecer `user` y `token` a `null` en el estado React.
2. WHEN el evento `storage` indica que el JWT_Token fue escrito o actualizado en otra pestaña, THE Auth_Context SHALL actualizar el token en el estado React sin reiniciar el Session_Timer de la pestaña actual.
3. WHEN el usuario extiende la sesión en una pestaña, THE Session_Timer en esa pestaña SHALL reiniciar su contador sin emitir eventos cross-tab, de modo que cada pestaña gestione su propio timer de forma independiente.
4. THE Auth_Context SHALL suscribirse al evento `storage` de `window` al montarse y desuscribirse al desmontarse para evitar fugas de memoria.

---

### Requirement 7: Configuración del período de inactividad

**User Story:** Como administrador de la aplicación, quiero poder configurar el período de inactividad a nivel de código, para ajustar el comportamiento según los requisitos de seguridad del proyecto.

#### Acceptance Criteria

1. THE Session_Timer SHALL aceptar el Inactivity_Period como parámetro entero en minutos en el rango [1, 1440] en la función `startSessionTimer`, con un valor por defecto de 15 si el parámetro se omite.
2. IF el parámetro Inactivity_Period está fuera del rango [1, 1440] o no es un número entero válido, THEN THE Session_Timer SHALL indicar el error al llamador y no iniciar el timer.
3. IF el parámetro Inactivity_Period es `null`, `undefined` o un valor no numérico, THEN THE Session_Timer SHALL usar 15 minutos como valor por defecto e iniciar el timer normalmente.
4. THE Session_Timer SHALL exponer el Warning_Window como una constante interna fija de exactamente 60 segundos, no configurable externamente, independientemente del valor de Inactivity_Period.
