import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext'; // <-- ¡Aquí volvimos a agregar la importación correcta!
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
import { useEffect } from 'react';

import heroImg from "./assets/hero-event.jpg"; 
import eventConference from "./assets/event-conference.jpg"; 
import eventFestival from "./assets/event-festival.jpg"; 
import eventWedding from "./assets/event-wedding.jpg"; 
import eventNetworking from "./assets/event-networking.jpg";

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.rol)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation(); // <-- 1. Capturamos la ubicación actual y su estado
// ── CRITERIO 2.4.2: ACTUALIZAR EL TÍTULO DE LA PÁGINA DE INICIO ──
  useEffect(() => {
    document.title = "Inicio - Gestión Inteligente de Eventos | EventosPro";
  }, []);

  // 2. Este efecto se encargará de centrar la sección en pantalla de forma exacta
  useEffect(() => {
    if (location.state && (location.state as any).scrollToSection) {
      const sectionId = (location.state as any).scrollToSection;
      const element = document.getElementById(sectionId);
      
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' // <-- ¡Aquí está el truco! Centra la sección "Nosotros" en el medio de la pantalla
          });
        }, 100);
      }
      
      // Limpiamos el estado para que no se vuelva a mover si el usuario recarga la página
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Muestra estática de categorías de eventos próximos mapeando las imágenes locales importadas
  const upcomingEvents = [
    {
      img: eventFestival,
      cat: "Festival",
      title: "Festival de Música Urbana 2026",
      date: "15 Jul 2026",
      loc: "Parque Central",
    },
    {
      img: eventConference,
      cat: "Conferencia",
      title: "TechSummit Latinoamérica",
      date: "22 Ago 2026",
      loc: "Centro de Convenciones",
    },
    {
      img: eventWedding,
      cat: "Privado",
      title: "Galas y Recepciones Premium",
      date: "Disponible todo el año",
      loc: "Múltiples sedes",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in" id="main-content">
      <main>
        {/* ── SECCIÓN HERO (BANNER PRINCIPAL) ───────────────────────── */}
        <section className="relative flex min-h-[85vh] items-center overflow-hidden bg-slate-950 text-white">
          <img
            src={heroImg}
            alt="Fondo de gestión de eventos"
            className="absolute inset-0 h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/80 to-transparent" />
          <div className="relative mx-auto max-w-7xl px-6 py-24 lg:py-32 w-full">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-white/10 px-4 py-1.5 text-xs font-medium text-emerald-400 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" /> Sistema inteligente de gestión de eventos
            </span>
           {/* CORRECCIÓN EN EL TÍTULO HERO PARA MODO CLARO Y OSCURO */}
            <h1 className="mt-6 max-w-3xl text-5xl font-bold leading-[1.1] tracking-tight md:text-6xl lg:text-7xl text-slate-900 dark:text-white">
              Organiza eventos{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-indigo-400 dark:to-cyan-400 bg-clip-text text-transparent inline-block">
                increíbles
              </span>
            </h1>
            
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              Plataforma todo-en-uno para crear, gestionar e inscribir asistentes a tus proyectos profesionales y corporativos con herramientas de vanguardia. Diseñada con accesibilidad WCAG 2.2 AA desde el primer píxel.
            </p>

            {/* Acciones dinámicas basadas en tu estado de autenticación real */}
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

        {/* ── SECCIÓN CARACTERÍSTICAS (FEATURES) — DISEÑO EXACTO DE LOVABLE ───────────────────────── */}
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
                  {/* Contenedor del icono con el círculo morado suave original de Lovable */}
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
        {/* ── SECCIÓN SOBRE NOSOTROS — ADAPTABLE A MODO OSCURO ───────────────────────────────────── */}
        <section id="nosotros" className="py-24 bg-background transition-colors duration-200">
          <div className="mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-2 lg:items-center">
            {/* Panel de Imágenes Estéticas */}
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
        {/* ── ESCAPARATE DE PRÓXIMOS EVENTOS ───────────────────────────── */}
        {/* ── ESCAPARATE DE PRÓXIMOS EVENTOS — ADAPTABLE A MODO OSCURO ───────────────────────────── */}
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
              {upcomingEvents.map((e, index) => (
                <article
                  key={index}
                  className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                    <img
                      src={e.img}
                      alt={e.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute top-4 left-4 inline-block rounded-full bg-indigo-50 dark:bg-indigo-950 px-3 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 shadow-sm">
                      {e.cat}
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold leading-snug text-foreground group-hover:text-[oklch(0.52_0.25_285)] dark:group-hover:text-indigo-400 transition-colors">{e.title}</h3>
                    <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" /> {e.date}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" /> {e.loc}
                      </span>
                    </div>
                    <div className="mt-5 pt-4 border-t border-border/40">
                      <Link to="/eventos" className="w-full inline-flex justify-center items-center gap-2 rounded-lg bg-muted hover:bg-indigo-50 dark:hover:bg-indigo-950/40 px-4 py-2 text-xs font-semibold text-foreground hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors">
                        Ver información completa
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECCIÓN CONTACTO DIRECTO ─────────────────────────────────── */}
        {/* ── SECCIÓN CONTACTO DIRECTO — ADAPTABLE A MODO OSCURO ─────────────────────────────────── */}
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

function AppContent() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* ── CRITERIO 2.4.1: ENLACE DE SALTO ACCESIBLE GLOBAL ── */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:bg-indigo-600 focus:text-white focus:px-4 focus:py-2.5 focus:rounded-xl focus:font-semibold focus:shadow-lg focus:z-[9999] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
        >
          Saltar al contenido principal
        </a>

        <Header />
        
        <Routes>
          {/* ── Rutas Públicas ───────────────────────────────────── */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />

          {/* ── Módulo ASISTENTE — Público ───────────────────────── */}
          <Route path="/eventos" element={<EventDiscoveryPage />} />
          <Route path="/eventos/:eventoId" element={<EventDetailPage />} />

          {/* ── Módulo ASISTENTE — Protegido ─────────────────────── */}
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

          {/* ── Módulo ORGANIZADOR ───────────────────────────────── */}
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

          {/* ── Módulo ADMINISTRADOR ─────────────────────────────── */}
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

          {/* ── Catch-all ────────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Footer />
        <AccessibilityMenu />
      </BrowserRouter>
    </AuthProvider>
  );
}
export default AppContent;