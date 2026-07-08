/**
 * WCAG 2.2 - Criterio 3.1.2: Idioma de las partes
 * Utilidad para detectar el idioma de fragmentos de texto
 * y permitir que los lectores de pantalla ajusten la pronunciación
 */

/**
 * Detecta si un texto contiene términos en inglés que requieren marcado de idioma
 * @param text - Texto a analizar
 * @returns 'en' si se detecta inglés, undefined si es español por defecto
 */
export function detectLanguage(text: string): string | undefined {
  if (!text || typeof text !== 'string') {
    return undefined;
  }

  // Patrones comunes de palabras en inglés usadas en eventos
  const englishPatterns = [
    // Términos tecnológicos
    /\b(tech|summit|conference|hackathon|workshop|webinar|bootcamp)\b/i,
    /\b(startup|pitch|demo|networking|meetup)\b/i,
    /\b(developer|coder|programmer|software|hardware)\b/i,
    
    // Términos de eventos
    /\b(event|festival|gala|showcase|expo)\b/i,
    /\b(live|show|session|keynote|panel)\b/i,
    
    // Términos de diversidad
    /\b(women|girls|ladies|diversity|inclusion)\b/i,
    
    // Términos de áreas específicas
    /\b(design|ux|ui|product|manager|leader|leadership)\b/i,
    /\b(business|marketing|sales|growth)\b/i,
    /\b(data|science|analytics|intelligence|ai|ml)\b/i,
    /\b(cloud|devops|cyber|security|blockchain)\b/i,
    
    // Frases compuestas comunes
    /\b(open source|machine learning|artificial intelligence)\b/i,
    /\b(user experience|user interface|agile|scrum)\b/i,
  ];

  // Si cualquier patrón coincide, marcamos como inglés
  const hasEnglish = englishPatterns.some(pattern => pattern.test(text));

  return hasEnglish ? 'en' : undefined;
}

/**
 * Variante que permite detectar múltiples idiomas (extensible)
 * @param text - Texto a analizar
 * @returns Código de idioma ISO 639-1 o undefined
 */
export function detectLanguageExtended(text: string): string | undefined {
  const lang = detectLanguage(text);
  
  // Aquí se podrían agregar más idiomas en el futuro
  // Por ahora solo detectamos inglés vs español (por defecto)
  
  return lang;
}

/**
 * Determina si un texto debe marcarse explícitamente con un atributo lang
 * @param text - Texto a evaluar
 * @param defaultLang - Idioma por defecto de la página (default: 'es')
 * @returns El código de idioma a usar o undefined si coincide con el default
 */
export function shouldMarkLanguage(text: string, defaultLang: string = 'es'): string | undefined {
  const detectedLang = detectLanguage(text);
  
  // Solo marcar si es diferente al idioma por defecto
  if (detectedLang && detectedLang !== defaultLang) {
    return detectedLang;
  }
  
  return undefined;
}
