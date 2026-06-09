import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
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
import GestionUsuariosPage from './pages/admin/GestionUsuariosPage';
import AuditoriaPage from './pages/admin/AuditoriaPage';
import './App.css';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.rol)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function HomePage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <main className="home-page" id="main-content">
      <section className="home-hero">
        <div className="container">
          <div className="home-hero__content animate-slide-up">
            <span className="home-hero__badge">🎪 Sistema de Gestión de Eventos</span>
            <h1 className="home-hero__title">
              Organiza eventos
              <span className="gradient-text"> increíbles</span>
            </h1>
            <p className="home-hero__subtitle">
              Plataforma inteligente para crear, gestionar e inscribirte a eventos con total accesibilidad.
            </p>
            <div className="home-hero__actions">
              {isAuthenticated ? (
                <>
                  {(user?.rol === 'organizador' || user?.rol === 'admin') && (
                    <a href="/eventos/crear" className="btn btn-primary btn-lg" id="hero-create-event">
                      🚀 Crear un Evento
                    </a>
                  )}
                  <a href="/eventos" className="btn btn-secondary btn-lg" id="hero-explore">
                    🔍 Explorar Eventos
                  </a>
                  <p className="home-hero__welcome">
                    ¡Bienvenido, <strong>{user?.nombre}</strong>! Rol: <strong>{user?.rol}</strong>
                  </p>
                </>
              ) : (
                <>
                  <a href="/eventos" className="btn btn-primary btn-lg" id="hero-explore-public">
                    🔍 Explorar Eventos
                  </a>
                  <a href="/registro" className="btn btn-secondary btn-lg" id="hero-register">
                    Comenzar Gratis
                  </a>
                  <a href="/login" className="btn btn-ghost btn-lg" id="hero-login">
                    Iniciar Sesión
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="home-features container" aria-label="Características principales">
        {[
          { icon: '🔍', title: 'Descubrimiento Público', desc: 'Explora eventos sin necesidad de cuenta. Filtra por categoría, fecha, precio y accesibilidad.' },
          { icon: '🎯', title: 'Gestión Inteligente', desc: 'Configura cada detalle: agenda, tipos de entrada, capacidad y más.' },
          { icon: '♿', title: 'Accesibilidad Total', desc: 'Diseñado bajo estándares WCAG 2.2 AA para todos los usuarios.' },
          { icon: '🎫', title: 'Boleto Digital QR', desc: 'Recibe tu boleto digital con código QR. Disponible offline sin internet.' },
        ].map((feat, i) => (
          <div key={i} className="home-feature card animate-fade-in">
            <span className="home-feature__icon" aria-hidden="true">{feat.icon}</span>
            <h3 className="home-feature__title">{feat.title}</h3>
            <p className="home-feature__desc">{feat.desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}

function AppContent() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only"
        style={{ position: 'absolute', left: '-9999px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden' }}
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

        {/* ── Módulo ORGANIZADOR ───────────────────────────────── */}
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
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
