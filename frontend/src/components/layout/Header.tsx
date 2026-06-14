import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

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
    <header className="header" role="banner">
      <div className="header__inner container">
        <Link to="/" className="header__brand" aria-label="EventosPro - Inicio">
          <span className="header__logo" aria-hidden="true">EP</span>
          <span className="header__brand-text">EventosPro</span>
        </Link>

        <nav className="header__nav" aria-label="Navegacion principal">
          <Link to="/eventos" className="header__link" id="nav-explore-events">
            Explorar eventos
          </Link>
          {isAuthenticated ? (
            <>
              {(user?.rol === 'organizador' || user?.rol === 'admin') && (
                <>
                  <Link to="/organizador" className="header__link" id="nav-organizer-hub">
                    Mi Panel
                  </Link>
                  <Link to="/eventos/crear" className="header__link" id="nav-create-event">
                    Crear Evento
                  </Link>
                </>
              )}
              {user?.rol === 'admin' && (
                <>
                  <Link to="/admin/usuarios" className="header__link" id="nav-admin-users">
                    Usuarios
                  </Link>
                  <Link to="/admin/auditoria" className="header__link" id="nav-admin-audit">
                    Auditoria
                  </Link>
                </>
              )}
              <div className="header__user-menu" ref={menuWrapperRef}>
                <button
                  ref={triggerRef}
                  className="header__user"
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={isMenuOpen}
                  aria-controls="user-menu"
                  aria-label={`Abrir menu de usuario de ${userName}`}
                  onClick={() => setIsMenuOpen((current) => !current)}
                  onKeyDown={handleUserButtonKeyDown}
                >
                  <span className="header__avatar" aria-hidden="true">
                    {userInitial}
                  </span>
                  <span className="header__user-name">{userName}</span>
                  <span className="header__chevron" aria-hidden="true">v</span>
                </button>

                {isMenuOpen && (
                  <div
                    id="user-menu"
                    className="header__dropdown"
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
                      className="header__dropdown-item"
                      onClick={navigateToProfile}
                    >
                      <span className="header__menu-icon" aria-hidden="true">ID</span>
                      Mi Perfil
                    </button>
                    <button
                      ref={(element) => {
                        menuItemRefs.current[1] = element;
                      }}
                      type="button"
                      role="menuitem"
                      className="header__dropdown-item"
                      id="btn-logout"
                      onClick={handleLogout}
                    >
                      <span className="header__menu-icon" aria-hidden="true">-&gt;</span>
                      Cerrar sesion
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="header__link" id="nav-login">
                Iniciar sesion
              </Link>
              <Link to="/registro" className="btn btn-primary btn-sm" id="nav-register">
                Registrarse
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
