import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ToastContainer from './components/ui/ToastContainer'; 
import {
  Search,
  Target,
  Accessibility,
  Ticket,
  Calendar,
  MapPin,
  ArrowRight,
  Mail,
  Phone,
  Sparkles,
  ShieldCheck,
  Users,
} from "lucide-react";
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import AccessibilityMenu from './components/ui/AccessibilityMenu';
import AccessibleTooltip from './components/ui/AccessibleTooltip';
import KeyboardShortcuts from './components/ui/KeyboardShortcuts';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import CreateEventPage from './pages/events/CreateEventPage';
import EventRegistrationPage from './pages/registration/EventRegistrationPage';
import EventDiscoveryPage from './pages/attendee/EventDiscoveryPage';
import EventDetailPage from './pages/attendee/EventDetailPage';
import DigitalTicketPage from './pages/attendee/DigitalTicketPage';
import SurveyPage from './pages/attendee/SurveyPage';
import ProfilePage from './pages/profile/ProfilePage';
import GestionUsuariosPage from './pages/admin/GestionUsuariosPage';
import AuditoriaPage from './pages/admin/AuditoriaPage';
import OrganizerHub from './pages/organizer/OrganizerHub';
import CheckinPage from './pages/organizer/CheckinPage';
import MonitorPage from './pages/organizer/MonitorPage';
import ReportPage from './pages/organizer/ReportPage';
import './App.css';
import { useEffect, useState, useRef, useCallback } from 'react';
import { apiRequest } from './api/client';

import heroImg from "./assets/hero-event.jpg"; 
import eventConference from "./assets/event-conference.jpg"; 
import eventNetworking from "./assets/event-networking.jpg";


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

/* ── Helpers ────────────────────────────────────────────────────────────── */

const getEventImage = (title: string) => {
  const t = title.toLowerCase();
  
  if (t.includes('techconf') || t.includes('tecnología') || t.includes('conferencia')) return eventConference; // Usamos las importadas en App.tsx
  if (t.includes('networking') || t.includes('mujeres')) return eventNetworking;
  
  return eventConference; // Respaldo global
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-EC', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user, initializing } = useAuth();
  if (initializing) return null; // espera a que termine la hidratación
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.rol)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation(); 
  const navigate = useNavigate();
  
  // Estado unificado usando la interfaz completa Evento
  const [eventosReales, setEventosReales] = useState<Evento[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [userPaused, setUserPaused] = useState(false);   // explicit user toggle
  const [hoverPaused, setHoverPaused] = useState(false);  // hover/focus temporary pause
  const slideIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [progressKey, setProgressKey] = useState(0);      // forces CSS animation restart

  // Derived: carousel is effectively paused when user OR hover says so
  const isPaused = userPaused || hoverPaused;

  useEffect(() => {
    document.title = "Inicio - Gestión Inteligente de Eventos | EventosPro";
  }, []);

  useEffect(() => {
    if (location.state && (location.state as any).scrollToSection) {
      const sectionId = (location.state as any).scrollToSection;
      const element = document.getElementById(sectionId);
      
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }, 100);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Fetch de eventos reales unificado sin conflictos de interfaces
  useEffect(() => {
    const fetchEventos = async () => {
      try {
        setLoadingEventos(true);
        const response = await apiRequest<Evento[]>('/eventos');
        
        if (response && response.data && Array.isArray(response.data)) {
          const eventosParaMostrar = response.data.slice(0, 3);
          setEventosReales(eventosParaMostrar);
        } else {
          setEventosReales([]);
        }
      } catch (error) {
        console.error('Error al cargar eventos:', error);
        setEventosReales([]);
      } finally {
        setLoadingEventos(false);
      }
    };

    fetchEventos();
  }, []);

  // Auto-rotación del carrusel con WCAG 2.2.2
  // The interval only runs when neither user nor hover has paused.
  useEffect(() => {
    if (isPaused || eventosReales.length <= 1) {
      if (slideIntervalRef.current) {
        clearInterval(slideIntervalRef.current);
        slideIntervalRef.current = null;
      }
      return;
    }

    // Reset progress bar animation every time the interval restarts
    setProgressKey(k => k + 1);

    slideIntervalRef.current = setInterval(() => {
      setCurrentSlide(prev => {
        const next = (prev + 1) % eventosReales.length;
        // Restart progress bar for the new slide
        setProgressKey(k => k + 1);
        return next;
      });
    }, 5000);

    return () => {
      if (slideIntervalRef.current) {
        clearInterval(slideIntervalRef.current);
        slideIntervalRef.current = null;
      }
    };
  }, [isPaused, eventosReales.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
    setProgressKey(k => k + 1);
    // Don't force-pause: respect the user's existing pause preference
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide(prev => (prev - 1 + eventosReales.length) % eventosReales.length);
    setProgressKey(k => k + 1);
  }, [eventosReales.length]);

  const nextSlide = useCallback(() => {
    setCurrentSlide(prev => (prev + 1) % eventosReales.length);
    setProgressKey(k => k + 1);
  }, [eventosReales.length]);

  // WCAG 2.2.2: explicit user control over auto-rotation
  const togglePause = useCallback(() => {
    setUserPaused(prev => !prev);
  }, []);

  // Hover/focus temporarily suppress auto-rotation but never override user intent
  const handleCarouselMouseEnter = useCallback(() => setHoverPaused(true), []);
  const handleCarouselMouseLeave = useCallback(() => setHoverPaused(false), []);
  const handleCarouselFocusCapture = useCallback(() => setHoverPaused(true), []);
  const handleCarouselBlurCapture = useCallback(() => setHoverPaused(false), []);

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in" id="main-content">
      <main>
        {/* ── SECCIÓN HERO (BANNER PRINCIPAL REPARADO) ───────────────────────── */}
        <section className="relative flex min-h-[85vh] items-center overflow-hidden bg-slate-950 text-white">
          <img
            src={heroImg}
            alt="Fondo de gestión de eventos"
            className="absolute inset-0 h-full w-full object-cover opacity-30 animate-pulse-slow"
          />
          
          <div className="absolute inset-0 bg-white/10 dark:bg-black/40 backdrop-blur-[1px] transition-colors duration-300" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/60 to-transparent" />
          
          <div className="relative mx-auto max-w-7xl px-6 py-24 lg:py-32 w-full z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-white/10 px-4 py-1.5 text-xs font-medium text-emerald-400 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" /> Sistema inteligente de gestión de eventos
            </span>
            
            <h1 className="mt-6 max-w-3xl text-5xl font-extrabold leading-[1.1] tracking-tight md:text-6xl lg:text-7xl text-white">
              Organiza eventos{" "}
              <span className="text-indigo-400 dark:text-cyan-400 inline-block font-black drop-shadow-sm">
                increíbles
              </span>
            </h1>
            
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-200 dark:text-slate-300">
              Plataforma todo-en-uno para crear, gestionar e inscribir asistentes a tus proyectos profesionales y corporativos con herramientas de vanguardia. Diseñada con accesibilidad WCAG 2.2 AA desde el primer píxel.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              {isAuthenticated ? (
                <div className="w-full">
                  <div className="flex flex-wrap gap-3 mb-4">
                    {(user?.rol === 'organizador' || user?.rol === 'admin') && (
                      <>
                        <Link to="/organizador" className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-all shadow-md">
                          🎪 Mi Panel Organizador
                        </Link>
                        <Link to="/eventos/crear" className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-6 py-3 text-sm font-semibold text-white transition-all">
                          🚀 Crear un Evento
                        </Link>
                      </>
                    )}
                    <Link to="/eventos" className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-6 py-3 text-sm font-semibold text-white transition-all">
                      <Search className="h-4 w-4" /> Explorar Eventos
                    </Link>
                  </div>
                  <p className="text-sm text-slate-400">
                    ¡Bienvenido de vuelta, <strong className="text-white">{user?.nombre}</strong>! Tu rol activo es: <span className="px-2 py-0.5 rounded bg-slate-800 text-xs text-emerald-400 uppercase tracking-wider font-semibold">{user?.rol}</span>
                  </p>
                </div>
              ) : (
                <>
                  <Link to="/eventos" className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-all shadow-md">
                    <Search className="h-4 w-4" /> Explorar Eventos
                  </Link>
                  <Link to="/registro" className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-6 py-3 text-sm font-semibold text-white transition-all">
                    Comenzar Gratis <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link to="/login" className="inline-flex items-center gap-2 rounded-lg bg-transparent hover:bg-white/5 px-6 py-3 text-sm font-semibold text-slate-300 hover:text-white transition-all">
                    Iniciar Sesión
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ── SECCIÓN CARACTERÍSTICAS (FEATURES) ───────────────────────── */}
        <section className="border-y border-border/60 bg-muted/40 py-20 transition-colors duration-200">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-12 max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-wider text-[oklch(0.52_0.25_285)] dark:text-indigo-400">
                Características
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Todo lo que necesitas en un solo lugar
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { 
                  icon: Search, 
                  title: 'Descubrimiento público', 
                  desc: 'Explora eventos sin necesidad de cuenta. Filtra por categoría, fecha, precio y accesibilidad.' 
                },
                { 
                  icon: Target, 
                  title: 'Gestión inteligente', 
                  desc: 'Configura cada detalle: agenda, tipos de entrada, capacidad y comunicaciones.' 
                },
                { 
                  icon: Accessibility, 
                  title: 'Accesibilidad total', 
                  desc: 'Diseñado bajo estándares inclusivos para que todos los usuarios naveguen sin excepciones.' 
                },
                { 
                  icon: Ticket, 
                  title: 'Boleto digital QR', 
                  desc: 'Recibe tu boleto digital con código QR. Disponible offline sin internet.' 
                },
              ].map((feat, i) => (
                <div 
                  key={i} 
                  className="feature-card group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card)]"
                >
                  <div className="feature-card__icon-wrap grid h-12 w-12 place-items-center rounded-xl transition-colors duration-300">
                    <feat.icon className="h-6 w-6" />
                  </div>
                  <h3 className="feature-card__title mt-5 text-lg font-semibold transition-colors">
                    {feat.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feat.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECCIÓN SOBRE NOSOTROS ───────────────────────────────────── */}
        <section id="nosotros" className="py-24 bg-background transition-colors duration-200">
          <div className="mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-2 lg:items-center">
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <img
                  src={eventConference}
                  alt="Conferencia profesional"
                  className="aspect-square rounded-2xl object-cover shadow-lg border border-border"
                />
                <img
                  src={eventNetworking}
                  alt="Evento de networking corporativo"
                  className="mt-10 aspect-square rounded-2xl object-cover shadow-lg border border-border"
                />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-[oklch(0.52_0.25_285)] dark:text-indigo-400">Sobre nosotros</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Conectamos personas a través de experiencias memorables
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                Creemos que cada encuentro es una oportunidad única para consolidar comunidades e impulsar ideas. Nuestra plataforma unifica diseño moderno, estabilidad técnica y herramientas de administración avanzada para que los organizadores controlen sus flujos y los asistentes disfruten del evento.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  { icon: ShieldCheck, t: "Seguridad y privacidad", d: "Cifrado integral de datos y registros confiables." },
                  { icon: Users, t: "Comunidad global", d: "Soporte multifuncional para organizadores independientes y empresas." },
                  { icon: Accessibility, t: "Enfoque inclusivo", d: "Desarrollo con conciencia de usabilidad en cada interacción." },
                ].map((item, index) => (
                  <li key={index} className="flex gap-4">
                    <span className="feature-card__icon-wrap grid h-10 w-10 shrink-0 place-items-center rounded-lg">
                      <item.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-semibold text-foreground">{item.t}</p>
                      <p className="text-sm text-muted-foreground">{item.d}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── SECCIÓN VIDEO DESTACADO ────────────────────────────────────────────────── */}
        <section className="border-t border-border/60 bg-background py-24 transition-colors duration-200">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-12 max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-wider text-[oklch(0.52_0.25_285)] dark:text-indigo-400">
                Video destacado
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Vive la experiencia
              </h2>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                Mira cómo se vivió nuestro último evento corporativo. Organiza el tuyo con EventosPro.
              </p>
            </div>

            <div className="relative aspect-video overflow-hidden rounded-2xl shadow-xl">
              <iframe
                src="https://www.youtube.com/embed/OWWJPNIX0V0"
                title="Video corporativo - 25 Aniversario GTT (Alicante) - Ejemplo de evento gestionado con EventosPro"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>

            <details className="mt-6 rounded-xl border border-border bg-muted/20 p-4">
              <summary className="cursor-pointer font-medium text-foreground">
                📄 Transcripción y descripción del video
              </summary>
              <div className="mt-3 space-y-4 text-sm text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Descripción</h3>
                  <p>El video muestra el evento del 25 aniversario de GTT en Alicante: recepción de asistentes, keynote principal, sesiones de networking y cierre del evento. La información visual (escenario, asistentes, logotipos) es decorativa y no añade contenido adicional al audio principal.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Transcripción</h3>
                  <div className="space-y-1 text-xs leading-relaxed">
                    <p><strong className="text-foreground">0:11</strong> Realmente es una satisfacción muy grande poder tenernos aquí a todos juntos hoy y sobre todo no olvidemos lo importante que es tener en cuenta nuestros principios, recordando de dónde venimos, quiénes somos, quién, en definitiva, nuestros orígenes.</p>
                    <p><strong className="text-foreground">0:35</strong> Ninguna compañía se mantiene a flote durante 25 años en una sólida base de clientes y desde aquí tenemos que agradecerles su confianza y su credibilidad.</p>
                    <p><strong className="text-foreground">0:46</strong> Somos los referentes en el ámbito de la tecnología tributaria.</p>
                    <p><strong className="text-foreground">0:54</strong> El gran impulso de realizar todo lo que hemos hecho es esas ganas de transformar la sociedad, de mejorar la sociedad y eso, destinados al ciudadano, porque es la esencia de nuestro trabajo.</p>
                    <p><strong className="text-foreground">1:08</strong> Me gustaría que se incorporase Paco de la Torre, que yo sin Paco de la Torre no hubiese sido capaz de hacer esto, gracias.</p>
                    <p><strong className="text-foreground">1:18</strong> Yo creo que nunca hemos tenido miedo a nada, nunca, y nunca hemos tenido la sensación de fracaso o de que nos podía ir mal, jamás, nunca.</p>
                    <p><strong className="text-foreground">1:29</strong> Yo no tengo ninguna duda de que GTT es la mejor empresa del mundo. El día que todos vosotros tengáis constancia y tengáis la seguridad de que trabajáis en la mejor empresa del mundo, GTT realmente será la mejor empresa del mundo.</p>
                    <p><strong className="text-foreground">1:52</strong> Ahora mismo estamos aquí 900 y pico personas viéndonos y todos pendientes de todos nosotros, pero hoy es vuestro día y que pasen, por favor, Alicia.</p>
                    <p><strong className="text-foreground">2:10</strong> [Música]</p>
                    <p><strong className="text-foreground">2:32</strong> Tenemos que sentirnos muy orgullosos, tenemos un futuro impresionante por delante como se está demostrando, disfrutemos.</p>
                  </div>
                </div>
                <p className="text-xs pt-2 border-t border-border/40">
                  No se requiere audiodescripción adicional. Subtítulos disponibles en el reproductor de YouTube (botón CC). También puedes{' '}
                  <a
                    href="https://www.youtube.com/watch?v=OWWJPNIX0V0"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                    aria-label="Ver en YouTube (se abre en nueva ventana)"
                  >
                    verlo directamente en YouTube ↗
                  </a>
                </p>
              </div>
            </details>
          </div>
        </section>

        {/* ── ESCAPARATE DE PRÓXIMOS EVENTOS (CARRUSEL + WCAG 2.2.2) ──────── */}
        <section id="eventos" className="border-t border-border/60 bg-muted/40 py-24 transition-colors duration-200">
          <div className="mx-auto max-w-7xl px-6">
            <div className="lg:grid lg:grid-cols-2 lg:gap-16 xl:gap-24 items-center">

              {/* ── Columna izquierda: texto descriptivo ──────────────── */}
              <div>
                <p className="text-sm font-medium uppercase tracking-wider text-[oklch(0.52_0.25_285)] dark:text-indigo-400">
                  Explorar catálogo
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                  Descubre lo que está pasando
                </h2>
                <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                  Explora nuestra selección de eventos profesionales y culturales diseñados para conectar personas e ideas. Participa en conferencias, talleres, espacios de networking y actividades especiales orientadas al aprendizaje, la colaboración y el intercambio de conocimientos. Descubre nuevas oportunidades, amplía tu red de contactos y forma parte de experiencias enriquecedoras que impulsan el crecimiento personal y profesional.                
                </p>

                <ul className="mt-8 space-y-4">
                  <li className="flex gap-4">
                    <span className="feature-card__icon-wrap grid h-10 w-10 shrink-0 place-items-center rounded-lg text-lg font-bold">
                      +
                    </span>
                    <div>
                      <p className="font-semibold text-foreground">{eventosReales.length > 0 ? eventosReales.length : '—'} eventos activos</p>
                      <p className="text-sm text-muted-foreground">Eventos disponibles para inscripción</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="feature-card__icon-wrap grid h-10 w-10 shrink-0 place-items-center rounded-lg text-lg">
                      ✓
                    </span>
                    <div>
                      <p className="font-semibold text-foreground">100% accesibles</p>
                      <p className="text-sm text-muted-foreground">Diseñados bajo estándares WCAG 2.2 AA</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="feature-card__icon-wrap grid h-10 w-10 shrink-0 place-items-center rounded-lg text-lg">
                      🎟
                    </span>
                    <div>
                      <p className="font-semibold text-foreground">Entrada gratuita</p>
                      <p className="text-sm text-muted-foreground">Registro sin costo para todos los asistentes</p>
                    </div>
                  </li>
                </ul>

                <Link
                  to="/eventos"
                  className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[oklch(0.52_0.25_285)] hover:bg-[oklch(0.45_0.25_285)] dark:bg-indigo-600 dark:hover:bg-indigo-500 px-6 py-3 text-sm font-semibold text-white transition-all shadow-md"
                >
                  Explorar todos los eventos <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* ── Columna derecha: carrusel ─────────────────────────── */}
              <div className="mt-12 lg:mt-0 max-w-lg mx-auto lg:mx-0">
                {loadingEventos ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="text-center">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                        <span className="sr-only">Cargando eventos...</span>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">Cargando eventos destacados...</p>
                    </div>
                  </div>
                ) : eventosReales.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No hay eventos disponibles en este momento.</p>
                  </div>
                ) : (
                  <div
                    ref={carouselRef}
                    onMouseEnter={handleCarouselMouseEnter}
                    onMouseLeave={handleCarouselMouseLeave}
                    onFocusCapture={handleCarouselFocusCapture}
                    onBlurCapture={handleCarouselBlurCapture}
                    role="region"
                    aria-roledescription="carousel"
                    aria-label="Eventos destacados"
                    aria-live="polite"
                  >
                    <div className="carousel-wrapper">
                      <div
                        className="carousel-track"
                        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                      >
                      {eventosReales.map((e, index) => (
                        <div
                          key={e.id || index}
                          className="carousel-slide"
                          role="group"
                          aria-roledescription="slide"
                          aria-label={`${index + 1} de ${eventosReales.length}: ${e.titulo}`}
                        >
                          <article
                            onClick={() => navigate(`/eventos/${e.id}`)}
                            className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer"
                            role="button"
                            tabIndex={index === currentSlide ? 0 : -1}
                            aria-label={`Ver detalles del evento ${e.titulo}`}
                            onKeyDown={(evt) => { if (evt.key === 'Enter' || evt.key === ' ') { evt.preventDefault(); navigate(`/eventos/${e.id}`); } }}
                          >
                            <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                              <img
                                src={e.imagen_portada || getEventImage(e.titulo)}
                                alt={`Portada de ${e.titulo}`}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                              <span className="absolute top-4 left-4 inline-block rounded-full bg-indigo-50 dark:bg-indigo-950 px-3 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 shadow-sm">
                                {e.tipo_evento_nombre || 'Evento'}
                              </span>
                              <div className="progress-bar">
                                <div
                                  key={index === currentSlide ? `active-${currentSlide}-${progressKey}` : `inactive-${index}`}
                                  className={`progress-bar__fill ${index === currentSlide && !isPaused ? 'progress-bar__fill--active' : ''} ${isPaused && index === currentSlide ? 'progress-bar__fill--paused' : ''}`}
                                />
                              </div>
                            </div>
                            <div className="p-6">
                              <h3 className="text-lg font-semibold leading-snug text-foreground group-hover:text-[oklch(0.52_0.25_285)] dark:group-hover:text-indigo-400 transition-colors">
                                {e.titulo}
                              </h3>
                              <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5" /> {formatDate(e.inicio)}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                  <MapPin className="h-3.5 w-3.5" /> {e.lugar_nombre || 'Sede Remota'}
                                </span>
                              </div>
                              <div className="mt-5 pt-4 border-t border-border/40">
                                <button 
                                  type="button"
                                  className="w-full inline-flex justify-center items-center gap-2 rounded-lg bg-muted hover:bg-indigo-50 dark:hover:bg-indigo-950/40 px-4 py-2 text-xs font-semibold text-foreground hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors"
                                  onClick={(evt) => {
                                    evt.stopPropagation();
                                    navigate(`/eventos/${e.id}`);
                                  }}
                                >
                                  Ver información completa
                                </button>
                              </div>
                            </div>
                          </article>
                        </div>
                      ))}
                      </div>
                    </div>

                    {eventosReales.length > 1 && (
                      <>
                        <div className="flex items-center justify-center gap-4 mt-6" role="toolbar" aria-label="Controles del carrusel">
                          <button
                            onClick={prevSlide}
                            className="carousel-btn"
                            aria-label="Evento anterior"
                          >
                            ←
                          </button>
                          <AccessibleTooltip content={userPaused ? 'Reanudar' : 'Pausar'}>
                            <button
                              onClick={togglePause}
                              className={`carousel-btn carousel-btn--pause${userPaused ? ' carousel-btn--pause-active' : ''}`}
                              aria-pressed={userPaused}
                              aria-label={userPaused ? 'Reanudar rotación automática' : 'Pausar rotación automática'}
                            >
                              {userPaused ? '▶' : '⏸'}
                            </button>
                          </AccessibleTooltip>
                          <button
                            onClick={nextSlide}
                            className="carousel-btn"
                            aria-label="Siguiente evento"
                          >
                            →
                          </button>
                        </div>

                        <div className="flex items-center justify-center gap-2 mt-3" role="tablist" aria-label="Seleccionar evento">
                          {eventosReales.map((e, i) => (
                            <button
                              key={i}
                              role="tab"
                              className={`carousel-dot ${i === currentSlide ? 'carousel-dot--active' : ''}`}
                              aria-selected={i === currentSlide}
                              aria-label={`Ir al evento ${i + 1}: ${e.titulo}`}
                              onClick={() => goToSlide(i)}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        </section>

        {/* ── SECCIÓN CONTACTO DIRECTO ─────────────────────────────────── */}
        <section id="contacto" className="border-t border-border/60 bg-background py-10 transition-colors duration-200">
          <div className="mx-auto max-w-5xl px-6">
            <div className="flex flex-wrap items-center gap-8">

              {/* Texto + redes */}
              <div className="min-w-[13rem] flex-1">
                <p className="text-xs font-medium uppercase tracking-wider text-[oklch(0.52_0.25_285)] dark:text-indigo-400">Canales de Atención</p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Contáctanos</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground max-w-xs">
                  ¿Tienes dudas? Nuestro equipo técnico está listo para ayudarte.
                </p>
                <div className="flex gap-3 mt-4">
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Visitar nuestro perfil oficial de Facebook"
                    className="text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-2 bg-muted/40 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl border border-border/40"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
                    <span className="sr-only">Facebook</span>
                  </a>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Visitar nuestro perfil oficial de Instagram"
                    className="text-muted-foreground hover:text-pink-600 dark:hover:text-pink-400 transition-colors p-2 bg-muted/40 hover:bg-pink-50 dark:hover:bg-pink-950/30 rounded-xl border border-border/40"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                    <span className="sr-only">Instagram</span>
                  </a>
                </div>
              </div>

              {/* Cards de contacto */}
              <div className="flex flex-wrap gap-3">
                <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 flex gap-3 items-center">
                  <span className="feature-card__icon-wrap grid h-9 w-9 shrink-0 place-items-center rounded-lg">
                    <Mail className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Correo Electrónico</p>
                    <p className="text-xs text-muted-foreground mt-0.5">soporte@eventmanagement.internal</p>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 flex gap-3 items-center">
                  <span className="feature-card__icon-wrap grid h-9 w-9 shrink-0 place-items-center rounded-lg">
                    <Phone className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Atención Telefónica</p>
                    <p className="text-xs text-muted-foreground mt-0.5">+593 5 2123 456</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <a 
            href="#main-content" 
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:bg-indigo-600 focus:text-white focus:px-4 focus:py-2.5 focus:rounded-xl focus:font-semibold focus:shadow-lg focus:z-[9999] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
          >
            Saltar al contenido principal
          </a>

          <Header />
        
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/eventos" element={<EventDiscoveryPage />} />
          <Route path="/eventos/:eventoId" element={<EventDetailPage />} />

          <Route path="/eventos/:eventoId/inscripcion" element={
            <ProtectedRoute>
              <EventRegistrationPage />
            </ProtectedRoute>
          } />
          <Route path="/mi-boleto/:inscripcionId" element={
            <ProtectedRoute>
              <DigitalTicketPage />
            </ProtectedRoute>
          } />
          <Route path="/eventos/:eventoId/encuesta" element={
            <ProtectedRoute>
              <SurveyPage />
            </ProtectedRoute>
          } />
          <Route path="/eventos/:eventoId/encuesta/:inscripcionId" element={
            <ProtectedRoute>
              <SurveyPage />
            </ProtectedRoute>
          } />
          <Route path="/perfil" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />

          <Route path="/organizador" element={
            <ProtectedRoute roles={['organizador', 'admin']}>
              <OrganizerHub />
            </ProtectedRoute>
          } />
          <Route path="/organizador/eventos/:eventoId/checkin" element={
            <ProtectedRoute roles={['organizador', 'admin']}>
              <CheckinPage />
            </ProtectedRoute>
          } />
          <Route path="/organizador/eventos/:eventoId/monitor" element={
            <ProtectedRoute roles={['organizador', 'admin']}>
              <MonitorPage />
            </ProtectedRoute>
          } />
          <Route path="/organizador/eventos/:eventoId/reporte" element={
            <ProtectedRoute roles={['organizador', 'admin']}>
              <ReportPage />
            </ProtectedRoute>
          } />
          <Route path="/eventos/crear" element={
            <ProtectedRoute roles={['organizador', 'admin']}>
              <CreateEventPage />
            </ProtectedRoute>
          } />

          <Route path="/admin/usuarios" element={
            <ProtectedRoute roles={['admin']}>
              <GestionUsuariosPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/auditoria" element={
            <ProtectedRoute roles={['admin']}>
              <AuditoriaPage />
            </ProtectedRoute>
          } />

          <Route path="/*" element={<Navigate to="/" replace />} />
        </Routes>

        <Footer />
        <AccessibilityMenu />
        <KeyboardShortcuts />
        <ToastContainer />
      </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
