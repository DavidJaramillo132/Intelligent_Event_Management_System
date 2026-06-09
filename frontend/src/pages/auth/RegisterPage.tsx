import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FormField from '../../components/ui/FormField';
import AlertMessage from '../../components/ui/AlertMessage';
import { validateEmail, validatePassword, validateRequired, validatePasswordMatch, getPasswordStrength } from '../../utils/validators';
import './auth.css';

export default function RegisterPage() {
  const { register, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    contrasena: '',
    confirmar: '',
    rol: 'asistente',
    telefono: '',
    ciudad: '',
    provincia: '',
    pais: 'Ecuador',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const strength = getPasswordStrength(form.contrasena);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    const nameErr = validateRequired(form.nombre, 'Nombre');
    if (nameErr) e.nombre = nameErr;
    const lastErr = validateRequired(form.apellido, 'Apellido');
    if (lastErr) e.apellido = lastErr;
    const emailErr = validateEmail(form.correo);
    if (emailErr) e.correo = emailErr;
    const passErr = validatePassword(form.contrasena);
    if (passErr) e.contrasena = passErr;
    const matchErr = validatePasswordMatch(form.contrasena, form.confirmar);
    if (matchErr) e.confirmar = matchErr;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    clearError();
    if (!validate()) return;

    try {
      await register({
        nombre: form.nombre,
        apellido: form.apellido,
        correo_electronico: form.correo,
        contrasena: form.contrasena,
        rol: form.rol,
        telefono: form.telefono || undefined,
        ciudad: form.ciudad || undefined,
        provincia: form.provincia || undefined,
        pais: form.pais || 'Ecuador',
      });
      setSuccess(true);
      setTimeout(() => navigate('/'), 1500);
    } catch {
      // error set in context
    }
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(p => ({ ...p, [field]: e.target.value }));
  };

  return (
    <main className="auth-page" id="main-content">
      <div className="auth-page__bg" aria-hidden="true" />
      <div className="auth-card auth-card--wide card-glass animate-slide-up">
        <div className="auth-card__header">
          <span className="auth-card__icon" aria-hidden="true">📝</span>
          <h1 className="auth-card__title">Crear Cuenta</h1>
          <p className="auth-card__subtitle">
            Únete para organizar o asistir a eventos increíbles
          </p>
        </div>

        {error && <AlertMessage type="error" message={error} onClose={clearError} />}
        {success && <AlertMessage type="success" message="¡Cuenta creada exitosamente! Redirigiendo..." />}

        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-form__row">
            <FormField
              id="register-nombre"
              label="Nombre"
              type="text"
              autoComplete="given-name"
              required
              value={form.nombre}
              onChange={update('nombre')}
              error={errors.nombre}
              placeholder="Juan"
            />

            <FormField
              id="register-apellido"
              label="Apellido"
              type="text"
              autoComplete="family-name"
              required
              value={form.apellido}
              onChange={update('apellido')}
              error={errors.apellido}
              placeholder="Pérez"
            />
          </div>

          <FormField
            id="register-email"
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            required
            value={form.correo}
            onChange={update('correo')}
            error={errors.correo}
            placeholder="tu@correo.com"
          />

          <FormField
            id="register-password"
            label="Contraseña"
            type="password"
            autoComplete="new-password"
            required
            value={form.contrasena}
            onChange={update('contrasena')}
            error={errors.contrasena}
            helpText="Mínimo 6 caracteres"
            placeholder="••••••••"
          />

          {form.contrasena && (
            <div className="password-strength" aria-label={`Fortaleza de contraseña: ${strength.label}`}>
              <div className="password-strength__bar">
                <div
                  className="password-strength__fill"
                  style={{ width: `${(strength.score / 5) * 100}%`, backgroundColor: strength.color }}
                />
              </div>
              <span className="password-strength__label" style={{ color: strength.color }}>
                {strength.label}
              </span>
            </div>
          )}

          <FormField
            id="register-confirm-password"
            label="Confirmar contraseña"
            type="password"
            autoComplete="new-password"
            required
            value={form.confirmar}
            onChange={update('confirmar')}
            error={errors.confirmar}
            placeholder="••••••••"
          />

          <FormField
            id="register-rol"
            label="Rol de usuario"
            as="select"
            required
            value={form.rol}
            onChange={update('rol')}
          >
            <option value="asistente">Asistente — Inscribirme a eventos</option>
            <option value="organizador">Organizador — Crear y gestionar eventos</option>
          </FormField>

          <FormField
            id="register-telefono"
            label="Teléfono"
            type="tel"
            autoComplete="tel"
            value={form.telefono}
            onChange={update('telefono')}
            placeholder="+593 999 999 999"
            helpText="Opcional — para notificaciones de eventos"
          />

          <div className="auth-form__row">
            <FormField
              id="register-ciudad"
              label="Ciudad"
              type="text"
              autoComplete="address-level2"
              value={form.ciudad}
              onChange={update('ciudad')}
              placeholder="Quito"
              helpText="Opcional"
            />

            <FormField
              id="register-provincia"
              label="Provincia"
              type="text"
              autoComplete="address-level1"
              value={form.provincia}
              onChange={update('provincia')}
              placeholder="Pichincha"
              helpText="Opcional"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
            id="btn-register"
          >
            {loading ? (
              <>
                <span className="btn-spinner" aria-hidden="true" />
                Creando cuenta...
              </>
            ) : (
              'Crear mi cuenta'
            )}
          </button>
        </form>

        <p className="auth-card__footer">
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" id="link-to-login">Inicia sesión</Link>
        </p>
      </div>
    </main>
  );
}
