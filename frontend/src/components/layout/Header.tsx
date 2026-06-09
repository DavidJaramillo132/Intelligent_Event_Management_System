import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header" role="banner">
      <div className="header__inner container">
        <Link to="/" className="header__brand" aria-label="EventosPro — Inicio">
          <span className="header__logo" aria-hidden="true">🎪</span>
          <span className="header__brand-text">EventosPro</span>
        </Link>

        <nav className="header__nav" aria-label="Navegación principal">
          <Link to="/eventos" className="header__link" id="nav-explore-events">
            🔍 Explorar eventos
          </Link>
          {isAuthenticated ? (
            <>
              {(user?.rol === 'organizador' || user?.rol === 'admin') && (
                <Link to="/eventos/crear" className="header__link" id="nav-create-event">
                  Crear Evento
                </Link>
              )}
              <span className="header__user" aria-label={`Usuario: ${user?.nombre}`}>
                <span className="header__avatar" aria-hidden="true">
                  {user?.nombre?.charAt(0).toUpperCase()}
                </span>
                <span className="header__user-name">{user?.nombre}</span>
              </span>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm" id="btn-logout" type="button">
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="header__link" id="nav-login">
                Iniciar sesión
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
