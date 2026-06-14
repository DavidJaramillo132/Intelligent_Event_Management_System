import { apiRequest } from './client';

export interface UserProfile {
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

export interface UpdateProfileData {
  nombre: string;
  telefono: string;
  ciudad: string;
  provincia: string;
}

export interface ChangePasswordData {
  contrasena_actual: string;
  nueva_contrasena: string;
  confirmar_contrasena: string;
}

export const profileApi = {
  obtenerPerfil: () => apiRequest<UserProfile>('/perfil/'),

  actualizarPerfil: (data: UpdateProfileData) =>
    apiRequest<UserProfile>('/perfil/', { method: 'PUT', body: data }),

  cambiarContrasena: (data: ChangePasswordData) =>
    apiRequest<void>('/perfil/contrasena', { method: 'PATCH', body: data }),
};
