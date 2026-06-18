import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext'; 
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
import { useEffect, useState } from 'react';
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
  const { isAuthenticated, user } = useAuth();
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
                  className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card)]"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-[oklch(0.52_0.25_285)]/10 text-[oklch(0.52_0.25_285)] dark:bg-indigo-950/50 dark:text-indigo-400 transition-colors duration-300 group-hover:bg-[oklch(0.52_0.25_285)] group-hover:text-white dark:group-hover:bg-indigo-600 dark:group-hover:text-white">
                    <feat.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-foreground transition-colors group-hover:text-[oklch(0.52_0.25_285)] dark:group-hover:text-indigo-400">
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
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[oklch(0.52_0.25_285)]/10 text-[oklch(0.52_0.25_285)] dark:text-indigo-400">
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
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <p>El video muestra el evento del 25 aniversario de GTT en Alicante: recepción de asistentes, keynote principal, sesiones de networking y cierre del evento. La información visual (escenario, asistentes, logotipos) es decorativa y no añade contenido adicional al audio principal.</p>
                <p className="text-xs">
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

        {/* ── ESCAPARATE DE PRÓXIMOS EVENTOS (TARJETAS CONECTADAS REALES) ───────────────────────────── */}
        <section id="eventos" className="border-t border-border/60 bg-muted/40 py-24 transition-colors duration-200">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-wider text-[oklch(0.52_0.25_285)] dark:text-indigo-400">Explorar catálogo</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                  Descubre lo que está pasando
                </h2>
              </div>
              <Link to="/eventos" className="inline-flex items-center gap-1 text-sm font-medium text-[oklch(0.52_0.25_285)] dark:text-indigo-400 hover:underline">
                Ver todos los eventos reales <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {loadingEventos ? (
                <div className="col-span-3 flex justify-center items-center py-12">
                  <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                      <span className="sr-only">Cargando eventos...</span>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">Cargando eventos destacados...</p>
                  </div>
                </div>
              ) : eventosReales.length === 0 ? (
                <div className="col-span-3 text-center py-12">
                  <p className="text-muted-foreground">No hay eventos disponibles en este momento.</p>
                </div>
              ) : (
                eventosReales.map((e, index) => (
                  <article
                    key={e.id || index}
                    onClick={() => navigate(`/eventos/${e.id}`)}
                    className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer"
                    role="button"
                    tabIndex={0}
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
                ))
              )}
            </div>
          </div>
        </section>

        {/* ── SECCIÓN CONTACTO DIRECTO ─────────────────────────────────── */}
        <section id="contacto" className="border-t border-border/60 bg-background py-24 transition-colors duration-200">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-12 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <p className="text-sm font-medium uppercase tracking-wider text-[oklch(0.52_0.25_285)] dark:text-indigo-400">Canales de Atención</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                  Contáctanos
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  ¿Tienes dudas sobre cómo implementar la gestión de tus eventos corporativos o masivos? Nuestro equipo técnico está listo para darte soporte.
                </p>

                <div className="flex gap-4 mt-6">
                  <a 
                    href="https://facebook.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    aria-label="Visitar nuestro perfil oficial de Facebook"
                    className="text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-2 bg-muted/40 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl border border-border/40"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
                    <span className="sr-only">Facebook</span>
                  </a>

                  <a 
                    href="https://instagram.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    aria-label="Visitar nuestro perfil oficial de Instagram"
                    className="text-muted-foreground hover:text-pink-600 dark:hover:text-pink-400 transition-colors p-2 bg-muted/40 hover:bg-pink-50 dark:hover:bg-pink-950/30 rounded-xl border border-border/40"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                    <span className="sr-only">Instagram</span>
                  </a>
                </div>
              </div>

              <div className="lg:col-span-2 grid gap-6 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-muted/20 p-6 flex gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[oklch(0.52_0.25_285)]/10 text-[oklch(0.52_0.25_285)] dark:text-indigo-400">
                    <Mail className="h-5 w-5" />
                  </span>
                  <div>
                    <h4 className="font-semibold text-foreground">Correo Electrónico</h4>
                    <p className="mt-1 text-sm text-muted-foreground">soporte@eventmanagement.internal</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-muted/20 p-6 flex gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[oklch(0.52_0.25_285)]/10 text-[oklch(0.52_0.25_285)] dark:text-indigo-400">
                    <Phone className="h-5 w-5" />
                  </span>
                  <div>
                    <h4 className="font-semibold text-foreground">Atención Telefónica</h4>
                    <p className="mt-1 text-sm text-muted-foreground">+593 5 2123 456</p>
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
      </BrowserRouter>
    </AuthProvider>
  );
}