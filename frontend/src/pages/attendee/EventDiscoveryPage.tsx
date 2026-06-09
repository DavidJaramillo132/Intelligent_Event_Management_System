import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../api/client';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import AlertMessage from '../../components/ui/AlertMessage';
import './attendee.css';

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

/* ── EventCard ─────────────────────────────────────────────────────────── */

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

  const cuposClass =
    evento.capacidad === 0 ? 'event-card__slots--full' :
    evento.capacidad <= 5 ? 'event-card__slots--low' : '';

  return (
    <article
      className="event-card animate-fade-in"
      role="button"
      tabIndex={0}
      aria-label={`Ver detalles del evento: ${evento.titulo}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {/* Image */}
      <div className="event-card__image-wrap">
        {evento.imagen_portada ? (
          <img
            src={evento.imagen_portada}
            alt={`Imagen del evento ${evento.titulo}`}
            className="event-card__image"
            loading="lazy"
          />
        ) : (
          <div className="event-card__image-placeholder" aria-hidden="true">🎪</div>
        )}

        {/* Badges */}
        <div className="event-card__badges" aria-label="Características del evento">
          {evento.tipo_evento_nombre && (
            <span className="badge badge--category">
              {evento.tipo_evento_nombre}
            </span>
          )}
          {evento.costo === 0 && (
            <span className="badge badge--free">Gratis</span>
          )}
          {evento.accesibilidad_fisica && (
            <span
              className="badge badge--accessible-physical"
              aria-label="Accesibilidad física disponible"
              title="Lugar con accesibilidad física"
            >
              ♿
            </span>
          )}
          {evento.accesibilidad_sensorial && (
            <span
              className="badge badge--accessible-sensory"
              aria-label="Accesibilidad sensorial disponible"
              title="Lugar con accesibilidad sensorial"
            >
              👂
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="event-card__body">
        <h2 className="event-card__title">{evento.titulo}</h2>
        {evento.descripcion && (
          <p className="event-card__desc">{evento.descripcion}</p>
        )}
        <div className="event-card__meta">
          <div className="event-card__meta-row">
            <span className="event-card__meta-icon" aria-hidden="true">📅</span>
            <span>{formatDate(evento.inicio)}</span>
          </div>
          {evento.lugar_nombre && (
            <div className="event-card__meta-row">
              <span className="event-card__meta-icon" aria-hidden="true">📍</span>
              <span>{evento.lugar_nombre}{evento.lugar_ciudad ? `, ${evento.lugar_ciudad}` : ''}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="event-card__footer">
        <span className={`event-card__price ${evento.costo === 0 ? 'event-card__price--free' : ''}`}>
          {evento.costo === 0 ? 'Gratis' : `$${evento.costo.toFixed(2)}`}
        </span>
        <span className={`event-card__slots ${cuposClass}`} aria-label={`${cuposLabel} disponibles`}>
          👥 {cuposLabel}
        </span>
      </div>
    </article>
  );
}

/* ── Main Component ─────────────────────────────────────────────────────── */

export default function EventDiscoveryPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [tiposEvento, setTiposEvento] = useState<TipoEvento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [pendingFilters, setPendingFilters] = useState<Filters>(defaultFilters);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

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
                className="search-bar__input"
                placeholder="Buscar eventos..."
                value={pendingFilters.q}
                onChange={handleSearchChange}
                autoComplete="off"
                aria-label="Buscar eventos por nombre o descripción"
              />
              <button
                type="submit"
                className="search-bar__btn"
                aria-label="Buscar"
              >
                🔍
              </button>
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
            <div
              className="events-grid"
              role="list"
              aria-label="Lista de eventos disponibles"
            >
              {eventos.length === 0 ? (
                <div className="events-empty" role="status">
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
                  <div key={ev.id} role="listitem">
                    <EventCard evento={ev} />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
