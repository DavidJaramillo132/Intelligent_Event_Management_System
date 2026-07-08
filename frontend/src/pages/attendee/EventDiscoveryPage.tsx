import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../api/client';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import AlertMessage from '../../components/ui/AlertMessage';
import AccessibleTooltip from '../../components/ui/AccessibleTooltip';
import HelpVideoModal from '../../components/ui/HelpVideoModal';
import { detectLanguage } from '../../utils/language';
import './attendee.css';
import evCyber from '../../assets/ev-cyber.jpg';
import evFeria from '../../assets/ev-feria.jpg';
import evHackathon from '../../assets/ev-hackathon.jpg';
import evNetworkingWom from '../../assets/ev-networking-women.jpg';
import evSinfonica from '../../assets/ev-sinfonica.jpg';
import evTechconf from '../../assets/ev-techconf.jpg';
import evUx from '../../assets/ev-ux.jpg';

/* ── Types ─────────────────────────────────────────────────────────────── */

interface Evento {
  id: string;
  titulo: string;
  descripcion?: string;
  inicio: string;
  fin: string;
  capacidad: number;
  costo: number;
  estado: string;
  imagen_portada?: string;
  tipo_evento_id: number;
  tipo_evento_nombre?: string;
  lugar_nombre?: string;
  lugar_ciudad?: string;
  accesibilidad_fisica: boolean;
  accesibilidad_sensorial: boolean;
}

const getEventImage = (title: string) => {
  const t = title.toLowerCase();
  
  if (t.includes('techconf') || t.includes('tecnología') || t.includes('conferencia')) return evTechconf;
  if (t.includes('hackquito') || t.includes('hackathon') || t.includes('programación')) return evHackathon;
  if (t.includes('ux') || t.includes('diseño') || t.includes('taller')) return evUx;
  if (t.includes('sinfónica') || t.includes('orquesta') || t.includes('música')) return evSinfonica;
  if (t.includes('cyber') || t.includes('seguridad') || t.includes('ia')) return evCyber;
  if (t.includes('feria') || t.includes('exposición')) return evFeria;
  if (t.includes('women') || t.includes('networking') || t.includes('mujeres')) return evNetworkingWom;
  
  return evTechconf; // Respaldo
};

interface TipoEvento {
  id: number;
  nombre: string;
}

interface Filters {
  q: string;
  tipo_evento_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  costo_min: string;
  costo_max: string;
  solo_accesibles: boolean;
}

const defaultFilters: Filters = {
  q: '',
  tipo_evento_id: '',
  fecha_inicio: '',
  fecha_fin: '',
  costo_min: '',
  costo_max: '',
  solo_accesibles: false,
};

/* ── Helpers ────────────────────────────────────────────────────────────── */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-EC', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function buildQuery(f: Filters): string {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  if (f.tipo_evento_id) p.set('tipo_evento_id', f.tipo_evento_id);
  if (f.fecha_inicio) p.set('fecha_inicio', f.fecha_inicio);
  if (f.fecha_fin) p.set('fecha_fin', f.fecha_fin);
  if (f.costo_min) p.set('costo_min', f.costo_min);
  if (f.costo_max) p.set('costo_max', f.costo_max);
  if (f.solo_accesibles) p.set('solo_accesibles', 'true');
  return p.toString();
}

function activeFilterCount(f: Filters): number {
  let n = 0;
  if (f.tipo_evento_id) n++;
  if (f.fecha_inicio || f.fecha_fin) n++;
  if (f.costo_min || f.costo_max) n++;
  if (f.solo_accesibles) n++;
  return n;
}

/* ── EventCard — REDISEÑO PREMIUM CORREGIDO ESTILO LOVABLE ──────────────── */

function EventCard({ evento }: { evento: Evento }) {
  const navigate = useNavigate();

  const handleClick = () => navigate(`/eventos/${evento.id}`);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const cuposLabel =
    evento.capacidad === 0 ? 'Sin cupos' :
    evento.capacidad <= 5 ? `¡Solo ${evento.capacidad} cupos!` :
    `${evento.capacidad} cupos`;

  return (
    <article
      className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/5 cursor-pointer h-full scroll-mt-20"
      role="button"
      tabIndex={0}
      aria-labelledby={`event-title-${evento.id} event-action-${evento.id}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {/* 1. Contenedor de la Imagen con Difuminado Inferior Estilo Lovable */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <img
          src={evento.imagen_portada || getEventImage(evento.titulo)}
          alt={`Imagen del evento ${evento.titulo}`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* Capa de degradado inferior para fusionar la foto con el fondo de la tarjeta */}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-90" />
        
        {/* Etiquetas flotantes sobre la imagen */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2 max-w-[calc(100%-2rem)]">
          {evento.tipo_evento_nombre && (
            <span className="inline-block rounded-full bg-indigo-600/90 px-3 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-sm">
              {evento.tipo_evento_nombre}
            </span>
          )}
          {evento.costo === 0 && (
            <span className="inline-block rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
              Gratis
            </span>
          )}
        </div>

        {/* Iconos Flotantes de Accesibilidad con un look moderno y limpio */}
        <div className="absolute bottom-4 right-4 flex gap-1.5 bg-background/60 backdrop-blur-md p-1.5 rounded-xl shadow-sm">
          {evento.accesibilidad_fisica && (
            <AccessibleTooltip content="Lugar con accesibilidad física">
              <span className="text-sm" aria-label="Accesibilidad física disponible" tabIndex={0}>♿</span>
            </AccessibleTooltip>
          )}
          {evento.accesibilidad_sensorial && (
            <AccessibleTooltip content="Lugar con accesibilidad sensorial">
              <span className="text-sm" aria-label="Accesibilidad sensorial disponible" tabIndex={0}>👂</span>
            </AccessibleTooltip>
          )}
        </div>
      </div>

      {/* 2. Cuerpo Interno de la Tarjeta (Información del Evento) */}
      <div className="flex flex-1 flex-col p-6">
        <h2 
          id={`event-title-${evento.id}`}
          className="text-xl font-bold tracking-tight text-foreground line-clamp-1 group-hover:text-[oklch(0.52_0.25_285)] dark:group-hover:text-indigo-400 transition-colors"
          lang={detectLanguage(evento.titulo)}
        >
          {evento.titulo}
        </h2>
        
        {evento.descripcion && (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-2">
            {evento.descripcion}
          </p>
        )}

        {/* Metadatos con Iconos Emoji Limpios alineados a la izquierda */}
        <div className="mt-4 space-y-2.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="text-base shrink-0" aria-hidden="true">📅</span>
            <span className="capitalize">{formatDate(evento.inicio)}</span>
          </div>
          {evento.lugar_nombre && (
            <div className="flex items-center gap-2">
              <span className="text-base shrink-0" aria-hidden="true">📍</span>
              <span className="truncate">{evento.lugar_nombre}{evento.lugar_ciudad ? `, ${evento.lugar_ciudad}` : ''}</span>
            </div>
          )}
        </div>

        {/* Contenedor Inferior: Costos y Capacidad de Cupos */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-border/40">
          <div>
            {evento.costo > 0 ? (
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                ${evento.costo.toFixed(2)}
              </span>
            ) : (
              <span className="text-2xl font-black text-emerald-500">
                Gratis
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-lg">
            <span>👥 {cuposLabel}</span>
          </div>
        </div>

        {/* 3. Botón de Acción Completo Azul Interactivo Extraído de Lovable */}
        <div className="mt-5">
          <button
            id={`event-action-${evento.id}`}
            type="button"
            className="w-full inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-95 hover:scale-[1.01] active:scale-[0.99]"
          >
            Ver detalles
          </button>
        </div>
      </div>
    </article>
  );
}

/* ── Main Component ─────────────────────────────────────────────────────── */

export default function EventDiscoveryPage() {
  useEffect(() => {
    document.title = "Explorar Catálogo de Eventos | EventosPro";
  }, []);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [tiposEvento, setTiposEvento] = useState<TipoEvento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [pendingFilters, setPendingFilters] = useState<Filters>(defaultFilters);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Debounced search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchEventos = useCallback(async (f: Filters) => {
    setLoading(true);
    setError(null);
    try {
      const qs = buildQuery(f);
      const res = await apiRequest<Evento[]>(`/eventos${qs ? `?${qs}` : ''}`);
      setEventos(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar eventos');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch tipos evento for filter dropdown
  useEffect(() => {
    apiRequest<TipoEvento[]>('/tipos-evento')
      .then(r => setTiposEvento(r.data ?? []))
      .catch(() => {});
  }, []);

  // Initial load
  useEffect(() => {
    fetchEventos(filters);
  }, []); // eslint-disable-line

  // Debounced search on text input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setPendingFilters(p => ({ ...p, q: v }));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const newF = { ...filters, q: v };
      setFilters(newF);
      fetchEventos(newF);
    }, 350);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const newF = { ...filters, q: pendingFilters.q };
    setFilters(newF);
    fetchEventos(newF);
  };

  const applyFilters = () => {
    setFilters(pendingFilters);
    fetchEventos(pendingFilters);
    setDrawerOpen(false);
  };

  const clearFilters = () => {
    const reset = { ...defaultFilters, q: filters.q };
    setPendingFilters(reset);
    setFilters(reset);
    fetchEventos(reset);
    setDrawerOpen(false);
  };

  const toggleDrawer = () => {
    setDrawerOpen(v => !v);
    if (!drawerOpen) {
      setTimeout(() => drawerRef.current?.focus(), 50);
    }
  };

  const filterCount = activeFilterCount(filters);

  return (
    <>
      {/* ── Hero with Search ──────────────────────────────────────────── */}
      <section className="discovery-hero" aria-label="Búsqueda de eventos">
        <div className="container">
          <div className="discovery-hero__content">
            <h1 className="discovery-hero__title">
              🎪 Descubre <span className="gradient-text">Eventos</span>
            </h1>
            <p className="discovery-hero__subtitle">
              Encuentra conferencias, talleres y más sin necesidad de registrarte
            </p>

            <form
              className="search-bar"
              role="search"
              aria-label="Buscar eventos"
              onSubmit={handleSearchSubmit}
            >
              <label htmlFor="search-input" className="sr-only">Buscar eventos por nombre o descripción</label>
              <input
                id="search-input"
                ref={searchInputRef}
                type="search"
                className="search-bar__input bg-white text-gray-900 focus:text-gray-900 dark:bg-white dark:text-gray-900 font-medium placeholder-gray-500"
                placeholder="Buscar eventos..."
                value={pendingFilters.q}
                onChange={handleSearchChange}
                autoComplete="off"
                aria-label="Buscar eventos por nombre o descripción"
              />
              <AccessibleTooltip content="Buscar eventos">
                <button
                  type="submit"
                  className="search-bar__btn"
                  aria-label="Buscar"
                >
                  🔍
                </button>
              </AccessibleTooltip>
            </form>
          </div>
        </div>
      </section>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <main className="discovery-page" id="main-content">
        <div className="container">

          {/* Filter Controls */}
          <div className="filter-controls" role="toolbar" aria-label="Controles de filtro">
            <button
              type="button"
              className="filter-controls__toggle"
              aria-expanded={drawerOpen}
              aria-controls="filter-drawer"
              onClick={toggleDrawer}
            >
              <span aria-hidden="true">⚙️</span>
              Filtros avanzados
              {filterCount > 0 && (
                <span className="filter-count" aria-label={`${filterCount} filtros activos`}>
                  {filterCount}
                </span>
              )}
            </button>

            <AccessibleTooltip content="Ver tutorial">
              <button
                type="button"
                className="btn-help-video btn-help-video--sm"
                onClick={() => setShowHelp(true)}
                aria-label="Ver tutorial de búsqueda y filtros"
              >
                ❓
              </button>
            </AccessibleTooltip>

            {filters.solo_accesibles && (
              <span className="filter-chip">
                <span aria-hidden="true">♿</span> Solo accesibles
              </span>
            )}
            {filters.tipo_evento_id && tiposEvento.find(t => String(t.id) === filters.tipo_evento_id) && (
              <span className="filter-chip">
                {tiposEvento.find(t => String(t.id) === filters.tipo_evento_id)?.nombre}
              </span>
            )}
          </div>

          {/* Filter Drawer */}
          {drawerOpen && (
            <div
              id="filter-drawer"
              className="filter-drawer"
              role="region"
              aria-label="Filtros avanzados"
              ref={drawerRef}
              tabIndex={-1}
            >
              <h2 className="filter-drawer__title">
                <span aria-hidden="true">⚙️</span> Filtros avanzados
              </h2>

              <div className="filter-drawer__grid">
                {/* Categoría */}
                <div className="filter-group">
                  <label className="filter-group__label" htmlFor="filter-category">
                    Categoría del evento
                  </label>
                  <select
                    id="filter-category"
                    value={pendingFilters.tipo_evento_id}
                    onChange={e => setPendingFilters(p => ({ ...p, tipo_evento_id: e.target.value }))}
                    aria-describedby="filter-category-hint"
                  >
                    <option value="">Todas las categorías</option>
                    {tiposEvento.map(t => (
                      <option key={t.id} value={String(t.id)}>{t.nombre}</option>
                    ))}
                  </select>
                  <span id="filter-category-hint" className="sr-only">
                    Selecciona una categoría para filtrar los eventos
                  </span>
                </div>

                {/* Rango de fechas */}
                <div className="filter-group">
                  <span className="filter-group__label" id="date-range-label">Rango de fechas</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <label htmlFor="filter-date-start" className="sr-only">Fecha de inicio</label>
                    <input
                      id="filter-date-start"
                      type="date"
                      value={pendingFilters.fecha_inicio}
                      onChange={e => setPendingFilters(p => ({ ...p, fecha_inicio: e.target.value }))}
                      aria-label="Fecha de inicio del rango"
                      aria-describedby="date-range-label"
                    />
                    <label htmlFor="filter-date-end" className="sr-only">Fecha de fin</label>
                    <input
                      id="filter-date-end"
                      type="date"
                      value={pendingFilters.fecha_fin}
                      min={pendingFilters.fecha_inicio}
                      onChange={e => setPendingFilters(p => ({ ...p, fecha_fin: e.target.value }))}
                      aria-label="Fecha de fin del rango"
                      aria-describedby="date-range-label"
                    />
                  </div>
                </div>

                {/* Rango de precios */}
                <div className="filter-group">
                  <span className="filter-group__label" id="price-range-label">Rango de precios (USD)</span>
                  <div className="price-range__inputs" role="group" aria-labelledby="price-range-label">
                    <label htmlFor="price-min" className="sr-only">Precio mínimo</label>
                    <input
                      id="price-min"
                      type="number"
                      className="price-range__input"
                      placeholder="Mín."
                      min="0"
                      value={pendingFilters.costo_min}
                      onChange={e => setPendingFilters(p => ({ ...p, costo_min: e.target.value }))}
                      aria-label="Precio mínimo"
                    />
                    <span className="price-range__sep" aria-hidden="true">—</span>
                    <label htmlFor="price-max" className="sr-only">Precio máximo</label>
                    <input
                      id="price-max"
                      type="number"
                      className="price-range__input"
                      placeholder="Máx."
                      min="0"
                      value={pendingFilters.costo_max}
                      onChange={e => setPendingFilters(p => ({ ...p, costo_max: e.target.value }))}
                      aria-label="Precio máximo"
                    />
                  </div>
                </div>

                {/* Accesibilidad */}
                <div className="filter-group">
                  <span className="filter-group__label" id="access-label">Accesibilidad</span>
                  <label className="accessibility-check" htmlFor="filter-accessible">
                    <input
                      id="filter-accessible"
                      type="checkbox"
                      checked={pendingFilters.solo_accesibles}
                      onChange={e => setPendingFilters(p => ({ ...p, solo_accesibles: e.target.checked }))}
                      aria-describedby="accessible-hint"
                    />
                    <span className="accessibility-check__icon" aria-hidden="true">♿</span>
                    <span className="accessibility-check__content">
                      <span className="accessibility-check__label">Solo eventos accesibles</span>
                      <span id="accessible-hint" className="accessibility-check__hint">
                        Lugares con accesibilidad física o sensorial
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="filter-drawer__actions">
                <button type="button" className="btn btn-primary" onClick={applyFilters} id="btn-apply-filters">
                  ✓ Aplicar filtros
                </button>
                <button type="button" className="btn btn-ghost" onClick={clearFilters} id="btn-clear-filters">
                  ✕ Limpiar
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && <AlertMessage type="error" message={error} onClose={() => setError(null)} />}

          {/* Results */}
          <div className="events-toolbar">
            <p className="events-count" aria-live="polite" aria-atomic="true">
              {loading ? 'Cargando...' : `${eventos.length} evento${eventos.length !== 1 ? 's' : ''} encontrado${eventos.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {loading ? (
            <LoadingSpinner message="Buscando eventos..." />
          ) : (
            /* Ajustamos la grilla para que use flexbox/grid moderno compatible con las nuevas tarjetas rounded-3xl */
            <div
              className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
              role="list"
              aria-label="Lista de eventos disponibles"
            >
              {eventos.length === 0 ? (
                <div className="col-span-full events-empty" role="status">
                  <span className="events-empty__icon" aria-hidden="true">🔍</span>
                  <h2 className="events-empty__title">Sin resultados</h2>
                  <p className="events-empty__desc">
                    No encontramos eventos con los criterios de búsqueda actuales.
                  </p>
                  <button type="button" className="btn btn-secondary" onClick={clearFilters}>
                    Limpiar filtros
                  </button>
                </div>
              ) : (
                eventos.map(ev => (
                  <div key={ev.id} role="listitem" className="h-full">
                    <EventCard evento={ev} />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
      {showHelp && (
        <HelpVideoModal
          videoSrc="/videos/IngresarAEvento.mp4"
          videoVtt="/videos/IngresarAEvento.vtt"
          title="Explorar Eventos"
          description="Se muestra cómo el usuario común hace el proceso de ingresar y registrarse a un evento gratuito."
          transcription={
            <>
              <p><strong className="text-foreground">0:00</strong> Una vez que el usuario haya iniciado sesión en la página, tendremos la sección "Descubrir eventos".</p>
              <p><strong className="text-foreground">0:12</strong> Aquí estarán todos los eventos disponibles: hay eventos de pago y eventos gratuitos. Al seleccionar uno gratuito, se muestra la información del evento.</p>
              <p><strong className="text-foreground">0:24</strong> Podemos ver la ubicación en Google Maps, la descripción de la actividad y la fecha de inicio.</p>
              <p><strong className="text-foreground">0:42</strong> Luego aceptamos los términos y seleccionamos el tipo de entrada.</p>
              <p><strong className="text-foreground">1:04</strong> Finalmente obtenemos la confirmación y podemos ver el boleto, con el cual podremos entrar al evento.</p>
            </>
          }
          onClose={() => setShowHelp(false)}
        />
      )}
    </>
  );
}
