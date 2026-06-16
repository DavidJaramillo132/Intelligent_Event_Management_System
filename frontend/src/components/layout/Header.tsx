import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, ChevronDown } from 'lucide-react';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuWrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuItemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const userName = user?.nombre || 'Usuario';
  const userInitial = userName.charAt(0).toUpperCase();

  const handleLogout = () => {
    setIsMenuOpen(false);
    logout();
    navigate('/login');
  };

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (!menuWrapperRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isMenuOpen]);

  const focusMenuItem = (index: number) => {
    menuItemRefs.current[index]?.focus();
  };

  const openMenuFromKeyboard = (index: number) => {
    setIsMenuOpen(true);
    window.setTimeout(() => focusMenuItem(index), 0);
  };

  const handleUserButtonKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      openMenuFromKeyboard(0);
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      openMenuFromKeyboard(1);
    }
  };

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = menuItemRefs.current.findIndex((item) => item === document.activeElement);

    if (event.key === 'Escape') {
      event.preventDefault();
      setIsMenuOpen(false);
      triggerRef.current?.focus();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusMenuItem(currentIndex === menuItemRefs.current.length - 1 ? 0 : currentIndex + 1);
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusMenuItem(currentIndex <= 0 ? menuItemRefs.current.length - 1 : currentIndex - 1);
    }

    if (event.key === 'Home') {
      event.preventDefault();
      focusMenuItem(0);
    }

    if (event.key === 'End') {
      event.preventDefault();
      focusMenuItem(menuItemRefs.current.length - 1);
    }
  };

  const navigateToProfile = () => {
    setIsMenuOpen(false);
    navigate('/perfil');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl transition-colors duration-200" role="banner">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        
        {/* LOGO CON EL CUADRADO CON GRADIENTE NATIVO DE LOVABLE */}
        <Link to="/" className="flex items-center gap-2 decoration-transparent" aria-label="EventosPro - Inicio">
          <span 
            className="grid h-9 w-9 place-items-center rounded-lg text-sm font-bold text-white shadow-md transition-all"
            style={{ backgroundImage: 'var(--gradient-hero)' }}
            aria-hidden="true"
          >
            EP
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            Eventos<span className="text-[oklch(0.52_0.25_285)] dark:text-indigo-400">Pro</span>
          </span>
        </Link>

        {/* NAVEGACIÓN PRINCIPAL ADAPTABLE */}
        {/* NAVEGACIÓN PRINCIPAL CORREGIDA CON RUTAS ABSOLUTAS INTERPÁGINAS */}
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex" aria-label="Navegacion principal">
          <Link to="/eventos" className="hover:text-foreground transition-colors decoration-transparent" id="nav-explore-events">
            Explorar eventos
          </Link>
          {/* Cambiamos a Link y pasamos el estado de la sección */}
          <Link to="/" state={{ scrollToSection: 'nosotros' }} className="hover:text-foreground transition-colors decoration-transparent">
            Nosotros
          </Link>
          <Link to="/" state={{ scrollToSection: 'contacto' }} className="hover:text-foreground transition-colors decoration-transparent">
            Contacto
          </Link>
          

          {isAuthenticated && (
            <>
              {(user?.rol === 'organizador' || user?.rol === 'admin') && (
                <>
                  <Link to="/organizador" className="hover:text-foreground transition-colors decoration-transparent" id="nav-organizer-hub">
                    Mi Panel
                  </Link>
                  <Link to="/eventos/crear" className="hover:text-foreground transition-colors decoration-transparent" id="nav-create-event">
                    Crear Evento
                  </Link>
                </>
              )}
              {user?.rol === 'admin' && (
                <>
                  <Link to="/admin/usuarios" className="hover:text-foreground transition-colors decoration-transparent" id="nav-admin-users">
                    Usuarios
                  </Link>
                  <Link to="/admin/auditoria" className="hover:text-foreground transition-colors decoration-transparent" id="nav-admin-audit">
                    Auditoria
                  </Link>
                </>
              )}
            </>
          )}
        </nav>

        {/* MENÚ DE ACCIONES SINCRO CON ACCESIBILIDAD */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="relative" ref={menuWrapperRef}>
              <button
                ref={triggerRef}
                className="flex items-center gap-2 rounded-xl border border-border bg-card p-1.5 pr-3 text-sm font-medium text-foreground shadow-sm hover:bg-accent transition-colors"
                type="button"
                aria-haspopup="true"
                aria-expanded={isMenuOpen}
                aria-controls="user-menu"
                aria-label={`Abrir menu de usuario de ${userName}`}
                onClick={() => setIsMenuOpen((current) => !current)}
                onKeyDown={handleUserButtonKeyDown}
              >
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-50 dark:bg-indigo-950 text-xs font-semibold text-indigo-600 dark:text-indigo-400" aria-hidden="true">
                  {userInitial}
                </span>
                <span className="text-xs font-medium max-w-[120px] truncate">{userName}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              </button>

              {isMenuOpen && (
                <div
                  id="user-menu"
                  className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl border border-border bg-card p-1 shadow-lg ring-1 ring-black/5 focus:outline-none z-50"
                  role="menu"
                  aria-label="Menu de usuario"
                  onKeyDown={handleMenuKeyDown}
                >
                  <button
                    ref={(element) => {
                      menuItemRefs.current[0] = element;
                    }}
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-accent transition-colors"
                    onClick={navigateToProfile}
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    Mi Perfil
                  </button>
                  <hr className="my-1 border-border" />
                  <button
                    ref={(element) => {
                      menuItemRefs.current[1] = element;
                    }}
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    id="btn-logout"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 text-rose-500" />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors decoration-transparent" id="nav-login">
                Iniciar sesión
              </Link>
              {/* EL BOTÓN CON EL DEGRADADO EXACTO EXTRAÍDO DE TU ARCHIVO DE ESTILOS */}
              <Link
                to="/registro"
                className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 hover:scale-[1.01] decoration-transparent"
                style={{ backgroundImage: 'var(--gradient-hero)' }}
                id="nav-register"
              >
                Registrarse
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}