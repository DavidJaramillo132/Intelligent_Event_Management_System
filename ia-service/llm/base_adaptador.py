from abc import ABC, abstractmethod
from typing import Dict, Any, List


class LLMAdapter(ABC):
    """Adaptador base para proveedores de LLM.
    Implementar esta interfaz para cambiar de proveedor (Gemini, Claude, OpenAI, etc.).
    """

    @abstractmethod
    async def predecir_asistencia(self, datos_evento: Dict[str, Any]) -> Dict[str, Any]:
        """Genera una predicción de asistencia para un evento.

        Args:
            datos_evento: Diccionario con titulo, tipo_evento, capacidad, costo,
                          fecha_inicio, lugar, ciudad, eventos_previos.

        Returns:
            Diccionario con asistencia_predicha, porcentaje_ocupacion,
            confianza, factores, recomendaciones.
        """
        pass

    @abstractmethod
    async def analizar_satisfaccion(self, datos_encuesta: Dict[str, Any]) -> Dict[str, Any]:
        """Analiza la satisfacción basándose en respuestas de encuestas.

        Args:
            datos_encuesta: Diccionario con titulo, tipo_evento, total_asistentes,
                            total_respuestas, respuestas.

        Returns:
            Diccionario con puntaje_promedio, sentimiento_general, resumen,
            puntos_positivos, puntos_mejora, analisis_por_pregunta.
        """
        pass

    @abstractmethod
    async def analizar_publico(self, datos_publico: Dict[str, Any]) -> Dict[str, Any]:
        """Analiza y segmenta el público objetivo de un evento.

        Args:
            datos_publico: Diccionario con evento_id, titulo, tipo_evento,
                           y asistentes (lista con ciudad, provincia, pais de cada uno).

        Returns:
            Diccionario con segmentos, distribucion_geografica, perfil_predominante,
            insights, recomendaciones_marketing.
        """
        pass