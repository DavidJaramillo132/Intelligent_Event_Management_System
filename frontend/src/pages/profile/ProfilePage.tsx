import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../api/client';
import { profileApi, type UserProfile } from '../../api/profileApi';
import FormField from '../../components/ui/FormField';
import './ProfilePage.css';

type ProfileForm = {
  nombre: string;
  telefono: string;
  ciudad: string;
  provincia: string;
};

type PasswordForm = {
  contrasena_actual: string;
  nueva_contrasena: string;
  confirmar_contrasena: string;
};

type ProfileField = keyof ProfileForm;
type PasswordField = keyof PasswordForm;

const emptyPasswordForm: PasswordForm = {
  contrasena_actual: '',
  nueva_contrasena: '',
  confirmar_contrasena: '',
};

function isPasswordStrong(value: string) {
  return value.length >= 8 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value);
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function ProfilePage() {
  useEffect(() => {
    document.title = "Mi Perfil de Usuario | EventosPro";
  }, []);
  const { updateUser } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    nombre: '',
    telefono: '',
    ciudad: '',
    provincia: '',
  });
  const [passwordForm, setPasswordForm] = useState<PasswordForm>(emptyPasswordForm);
  
  const [profileErrors, setProfileErrors] = useState<Partial<Record<ProfileField | 'general', string>>>({});
  const [passwordErrors, setPasswordErrors] = useState<Partial<Record<PasswordField | 'general', string>>>({});
  
  const [profileStatus, setProfileStatus] = useState('');
  const [passwordStatus, setPasswordStatus] = useState('');
  
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the latest profile data
    profileApi.obtenerPerfil().then((res) => {
      if (res.data) {
        setUser(res.data);
        setProfileForm({
          nombre: res.data.nombre || '',
          telefono: res.data.telefono || '',
          ciudad: res.data.ciudad || '',
          provincia: res.data.provincia || '',
        });
      }
    }).catch(err => {
      console.error("Error loading profile", err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const passwordChecks = [
    { id: 'length', label: '8 caracteres', ok: passwordForm.nueva_contrasena.length >= 8 },
    { id: 'upper', label: 'Mayúscula', ok: /[A-Z]/.test(passwordForm.nueva_contrasena) },
    { id: 'lower', label: 'Minúscula', ok: /[a-z]/.test(passwordForm.nueva_contrasena) },
    { id: 'number-symbol', label: 'Número y símbolo', ok: /[0-9]/.test(passwordForm.nueva_contrasena) && /[^A-Za-z0-9]/.test(passwordForm.nueva_contrasena) },
  ];

  const updateProfileField = (field: ProfileField) => (event: ChangeEvent<HTMLInputElement>) => {
    setProfileForm((current) => ({ ...current, [field]: event.target.value }));
    setProfileErrors((current) => ({ ...current, [field]: undefined, general: undefined }));
    setProfileStatus('');
  };

  const updatePasswordField = (field: PasswordField) => (event: ChangeEvent<HTMLInputElement>) => {
    setPasswordForm((current) => ({ ...current, [field]: event.target.value }));
    setPasswordErrors((current) => ({ ...current, [field]: undefined, general: undefined }));
    setPasswordStatus('');
  };

  const validateProfile = () => {
    const errors: Partial<Record<ProfileField, string>> = {};
    if (!profileForm.nombre.trim()) errors.nombre = 'El nombre de usuario es requerido.';
    if (!profileForm.telefono.trim()) errors.telefono = 'El teléfono es requerido.';
    if (profileForm.telefono.trim() && !/^[0-9+()\-\s]{7,30}$/.test(profileForm.telefono.trim())) {
      errors.telefono = 'Ingresa un teléfono válido.';
    }
    if (!profileForm.ciudad.trim()) errors.ciudad = 'La ciudad es requerida.';
    if (!profileForm.provincia.trim()) errors.provincia = 'La provincia es requerida.';
    return errors;
  };

  const submitProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = validateProfile();
    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }

    setSavingProfile(true);
    setProfileErrors({});
    setProfileStatus('');

    try {
      const response = await profileApi.actualizarPerfil({
        nombre: profileForm.nombre.trim(),
        telefono: profileForm.telefono.trim(),
        ciudad: profileForm.ciudad.trim(),
        provincia: profileForm.provincia.trim(),
      });
      if (response.data) {
        setUser(response.data);
        updateUser(response.data as any);
        setProfileStatus('Tus datos han sido actualizados exitosamente.');
      }
    } catch (error) {
      if (error instanceof ApiError && error.field && error.field in profileForm) {
        setProfileErrors({ [error.field as ProfileField]: error.message });
      } else {
        setProfileErrors({ general: getErrorMessage(error, 'No se pudo actualizar el perfil. Inténtalo de nuevo.') });
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const submitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors: Partial<Record<PasswordField, string>> = {};

    if (!passwordForm.contrasena_actual) errors.contrasena_actual = 'La contraseña actual es requerida.';
    if (!isPasswordStrong(passwordForm.nueva_contrasena)) {
      errors.nueva_contrasena = 'Usa al menos 8 caracteres con mayúscula, minúscula, número y símbolo.';
    }
    if (passwordForm.nueva_contrasena !== passwordForm.confirmar_contrasena) {
      errors.confirmar_contrasena = 'Las contraseñas no coinciden.';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setSavingPassword(true);
    setPasswordErrors({});
    setPasswordStatus('');

    try {
      await profileApi.cambiarContrasena(passwordForm);
      setPasswordForm(emptyPasswordForm);
      setPasswordStatus('Tu contraseña ha sido cambiada exitosamente.');
    } catch (error) {
      if (error instanceof ApiError && error.field && error.field in passwordForm) {
        setPasswordErrors({ [error.field as PasswordField]: error.message });
      } else {
        setPasswordErrors({ general: getErrorMessage(error, 'No se pudo actualizar la contraseña. Verifica tu contraseña actual.') });
      }
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <main className="profile-page">
        <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>
          <p>Cargando tu perfil...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="profile-page" id="main-content">
      <div className="profile-page__container">
        
        <header className="profile-page__header">
          <h1 className="profile-page__title">Mi Perfil</h1>
          <p className="profile-page__subtitle">Administra tu información personal y la seguridad de tu cuenta</p>
          {user?.correo_electronico && (
            <div className="profile-page__email">
              <span aria-hidden="true">✉️</span> {user.correo_electronico}
            </div>
          )}
        </header>

        <div className="profile-page__content">
          {/* Card: Información Personal */}
          <section className="profile-card" aria-labelledby="personal-info-heading">
            <div className="profile-card__header">
              <div className="profile-card__icon" aria-hidden="true">👤</div>
              <h2 id="personal-info-heading" className="profile-card__title">Información Personal</h2>
            </div>

            <form className="profile-form" onSubmit={submitProfile} aria-busy={savingProfile}>
              {profileErrors.general && (
                <div className="profile-alert profile-alert--error" role="alert">
                  <span aria-hidden="true">⚠️</span> {profileErrors.general}
                </div>
              )}
              {profileStatus && (
                <div className="profile-alert profile-alert--success" role="status">
                  <span aria-hidden="true">✅</span> {profileStatus}
                </div>
              )}

              <div className="profile-form__row">
                <FormField
                  id="profile-name"
                  label="Nombre de Usuario"
                  type="text"
                  required
                  autoComplete="name"
                  value={profileForm.nombre}
                  onChange={updateProfileField('nombre')}
                  error={profileErrors.nombre}
                />
                <FormField
                  id="profile-phone"
                  label="Teléfono"
                  type="tel"
                  required
                  autoComplete="tel"
                  inputMode="tel"
                  value={profileForm.telefono}
                  onChange={updateProfileField('telefono')}
                  error={profileErrors.telefono}
                />
              </div>

              <div className="profile-form__row">
                <FormField
                  id="profile-city"
                  label="Ciudad"
                  type="text"
                  required
                  autoComplete="address-level2"
                  value={profileForm.ciudad}
                  onChange={updateProfileField('ciudad')}
                  error={profileErrors.ciudad}
                />
                <FormField
                  id="profile-province"
                  label="Provincia"
                  type="text"
                  required
                  autoComplete="address-level1"
                  value={profileForm.provincia}
                  onChange={updateProfileField('provincia')}
                  error={profileErrors.provincia}
                />
              </div>

              <div className="profile-form__actions">
                <button className="btn btn-primary" type="submit" disabled={savingProfile}>
                  {savingProfile ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </section>

          {/* Card: Seguridad */}
          <section className="profile-card" aria-labelledby="security-heading">
            <div className="profile-card__header">
              <div className="profile-card__icon" aria-hidden="true">🔒</div>
              <h2 id="security-heading" className="profile-card__title">Seguridad</h2>
            </div>

            <form className="profile-form" onSubmit={submitPassword} aria-busy={savingPassword}>
              {passwordErrors.general && (
                <div className="profile-alert profile-alert--error" role="alert">
                  <span aria-hidden="true">⚠️</span> {passwordErrors.general}
                </div>
              )}
              {passwordStatus && (
                <div className="profile-alert profile-alert--success" role="status">
                  <span aria-hidden="true">✅</span> {passwordStatus}
                </div>
              )}

              <FormField
                id="profile-current-password"
                label="Contraseña Actual"
                type="password"
                required
                autoComplete="current-password"
                value={passwordForm.contrasena_actual}
                onChange={updatePasswordField('contrasena_actual')}
                error={passwordErrors.contrasena_actual}
              />
              
              <FormField
                id="profile-new-password"
                label="Nueva Contraseña"
                type="password"
                required
                autoComplete="new-password"
                value={passwordForm.nueva_contrasena}
                onChange={updatePasswordField('nueva_contrasena')}
                error={passwordErrors.nueva_contrasena}
              />

              <ul className="password-rules" aria-live="polite" aria-label="Validación de fuerza de contraseña">
                {passwordChecks.map((check) => (
                  <li key={check.id} className={check.ok ? 'password-rule password-rule--ok' : 'password-rule'}>
                    <span className="password-rule__icon" aria-hidden="true">{check.ok ? '✓' : '×'}</span>
                    {check.label}
                  </li>
                ))}
              </ul>

              <FormField
                id="profile-confirm-password"
                label="Confirmar Nueva Contraseña"
                type="password"
                required
                autoComplete="new-password"
                value={passwordForm.confirmar_contrasena}
                onChange={updatePasswordField('confirmar_contrasena')}
                error={passwordErrors.confirmar_contrasena}
              />

              <div className="profile-form__actions">
                <button className="btn btn-primary" type="submit" disabled={savingPassword}>
                  {savingPassword ? 'Actualizando...' : 'Actualizar Contraseña'}
                </button>
              </div>
            </form>
          </section>
        </div>

      </div>
    </main>
  );
}
