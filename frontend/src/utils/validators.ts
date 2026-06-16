export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'El correo electrónico es requerido';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) return 'El correo electrónico debe incluir un símbolo "@" seguido de un dominio válido (ej: usuario@ejemplo.com)';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'La contraseña es requerida';
  if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres. Ingresa una contraseña más larga.';
  return null;
}

export function validateRequired(value: string, fieldName: string): string | null {
  if (!value.trim()) return `${fieldName} es requerido. Por favor, completa este campo antes de continuar.`;
  return null;
}

export function validateMinLength(value: string, min: number, fieldName: string): string | null {
  if (value.trim().length < min) return `${fieldName} debe tener al menos ${min} caracteres`;
  return null;
}

export function validateNumber(value: string, fieldName: string, min?: number): string | null {
  const num = Number(value);
  if (isNaN(num)) return `${fieldName} debe ser un número`;
  if (min !== undefined && num < min) return `${fieldName} debe ser al menos ${min}`;
  return null;
}

export function validatePasswordMatch(password: string, confirm: string): string | null {
  if (password !== confirm) return 'Las contraseñas no coinciden. Asegúrate de escribir la misma contraseña en ambos campos.';
  return null;
}

export function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels: { label: string; color: string }[] = [
    { label: 'Muy débil', color: '#DC2626' },
    { label: 'Débil', color: '#D97706' },
    { label: 'Aceptable', color: '#D97706' },
    { label: 'Fuerte', color: '#059669' },
    { label: 'Muy fuerte', color: '#059669' },
  ];

  return { score, ...levels[Math.min(score, levels.length - 1)] };
}
