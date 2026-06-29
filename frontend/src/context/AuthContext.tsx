import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../api/client';

export interface User {
  id: string;
  nombre: string;
  apellido: string;
  correo_electronico: string;
  rol: string;
  telefono?: string;
  ciudad?: string;
  provincia?: string;
  pais: string;
}

interface AuthState {
  token: string;
  refresh_token: string;
  expires_in: number;
  usuario: User;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  initializing: boolean;
  login: (correo: string, contrasena: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (usuario: User) => void;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

interface RegisterData {
  nombre: string;
  apellido: string;
  correo_electronico: string;
  contrasena: string;
  rol: string;
  telefono?: string;
  ciudad?: string;
  provincia?: string;
  pais?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

/** Lee el auth guardado en localStorage de forma síncrona */
function readStoredAuth(): { user: User | null; token: string | null } {
  try {
    const stored = localStorage.getItem('auth');
    if (!stored) return { user: null, token: null };
    const auth: AuthState = JSON.parse(stored);
    if (auth?.token && auth?.usuario) {
      return { user: auth.usuario, token: auth.token };
    }
  } catch {
    localStorage.removeItem('auth');
  }
  return { user: null, token: null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Inicialización lazy síncrona: evita el gap de null → estado real al refrescar
  const [user, setUser] = useState<User | null>(() => readStoredAuth().user);
  const [token, setToken] = useState<string | null>(() => readStoredAuth().token);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // initializing siempre false porque la hidratación es síncrona en el constructor del state
  const initializing = false;

  // Sincroniza en caso de cambios en otra pestaña
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== 'auth') return;
      const { user: u, token: t } = readStoredAuth();
      setUser(u);
      setToken(t);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const login = async (correo: string, contrasena: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<AuthState>('/auth/login', {
        correo_electronico: correo,
        contrasena,
      });
      if (res.data) {
        localStorage.setItem('auth', JSON.stringify(res.data));
        setUser(res.data.usuario);
        setToken(res.data.token);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<AuthState>('/auth/register', data);
      if (res.data) {
        localStorage.setItem('auth', JSON.stringify(res.data));
        setUser(res.data.usuario);
        setToken(res.data.token);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth');
    setUser(null);
    setToken(null);
  };

  const updateUser = (usuario: User) => {
    setUser(usuario);
    const stored = localStorage.getItem('auth');
    if (!stored) return;

    try {
      const auth: AuthState = JSON.parse(stored);
      localStorage.setItem('auth', JSON.stringify({ ...auth, usuario }));
    } catch {
      localStorage.removeItem('auth');
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, initializing, login, register, logout, updateUser, loading, error, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
