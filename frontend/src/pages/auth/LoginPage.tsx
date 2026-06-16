import { useState, useEffect } from 'react';
import type { FormEvent } from 'react'; // <-- ¡Aquí le especificamos que es un tipo de TypeScript!
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FormField from '../../components/ui/FormField';
import AlertMessage from '../../components/ui/AlertMessage';
import { validateEmail, validatePassword } from '../../utils/validators';
import './auth.css';

export default function LoginPage() {
  useEffect(() => {
    document.title = "Iniciar Sesión | EventosPro";
  }, []);
  const { login, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({ correo: '', contrasena: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    const emailErr = validateEmail(form.correo);
    if (emailErr) e.correo = emailErr;
    const passErr = validatePassword(form.contrasena);
    if (passErr) e.contrasena = passErr;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    clearError();
    if (!validate()) return;

    try {
      await login(form.correo, form.contrasena);
      setSuccess(true);
      setTimeout(() => navigate('/'), 1000);
    } catch {
      // error is set in context
    }
  };

  return (
    <main className="auth-page" id="main-content">
      <div className="auth-page__bg" aria-hidden="true" />
      <div className="auth-card card-glass animate-slide-up">
        <div className="auth-card__header">
          <span className="auth-card__icon" aria-hidden="true">🔐</span>
          <h1 className="auth-card__title">Iniciar Sesión</h1>
          <p className="auth-card__subtitle">
            Accede a tu cuenta para gestionar eventos
          </p>
        </div>

        {error && <AlertMessage type="error" message={error} onClose={clearError} />}
        {success && <AlertMessage type="success" message="¡Inicio de sesión exitoso! Redirigiendo..." />}

        <form onSubmit={handleSubmit} noValidate>
          <FormField
            id="login-email"
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            required
            value={form.correo}
            onChange={e => setForm(p => ({ ...p, correo: e.target.value }))}
            error={errors.correo}
            placeholder="tu@correo.com"
          />

          <FormField
            id="login-password"
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            required
            value={form.contrasena}
            onChange={e => setForm(p => ({ ...p, contrasena: e.target.value }))}
            error={errors.contrasena}
            placeholder="••••••••"
          />

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
            id="btn-login"
          >
            {loading ? (
              <>
                <span className="btn-spinner" aria-hidden="true" />
                Ingresando...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <p className="auth-card__footer">
          ¿No tienes una cuenta?{' '}
          <Link to="/registro" id="link-to-register">Regístrate aquí</Link>
        </p>
      </div>
    </main>
  );
}
