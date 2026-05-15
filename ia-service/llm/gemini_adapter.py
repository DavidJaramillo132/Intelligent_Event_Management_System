import os
import json
import re
from typing import Dict, Any

from google import genai
from llm.base_adaptador import LLMAdapter


class GeminiAdapter(LLMAdapter):
    """Adaptador de Gemini para el servicio de IA de eventos."""

    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY no está configurada en las variables de entorno.")

        self.client = genai.Client(api_key=api_key)
        self.model_name = "gemini-2.0-flash-lite"

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _extraer_json(self, texto: str) -> dict:
        """Extrae JSON de la respuesta del modelo, eliminando markdown si existe."""
        texto = texto.strip()
        # Eliminar bloques de código markdown (```json ... ```)
        match = re.search(r"```(?:json)?\s*([\s\S]*?)```", texto)
        if match:
            texto = match.group(1).strip()
        return json.loads(texto)

    def _generar(self, prompt: str, max_tokens: int = 1024) -> str:
        """Envía un prompt a Gemini y retorna el texto de la respuesta."""
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config={"max_output_tokens": max_tokens},
        )
        return response.text

    # ── Implementaciones ──────────────────────────────────────────────────────

    def predecir_asistencia(self, datos_evento: Dict[str, Any]) -> Dict[str, Any]:
        eventos_previos = datos_evento.get("eventos_previos", [])
        if eventos_previos:
            historial = "\n".join([
                f"- {e.get('titulo')}: {e.get('asistentes')}/{e.get('capacidad')} asistentes"
                for e in eventos_previos
            ])
        else:
            historial = "Sin historial previo disponible."

        prompt = f"""Eres un experto en análisis de eventos. Analiza los siguientes datos y predice la asistencia.

Evento:
- Título: {datos_evento.get('titulo')}
- Tipo: {datos_evento.get('tipo_evento')}
- Capacidad máxima: {datos_evento.get('capacidad')} personas
- Costo: ${datos_evento.get('costo')}
- Fecha: {datos_evento.get('fecha_inicio')}
- Lugar: {datos_evento.get('lugar')}, {datos_evento.get('ciudad')}

Historial de eventos similares:
{historial}

Responde ÚNICAMENTE con este JSON sin explicaciones ni markdown:
{{
  "asistencia_predicha": <número entero>,
  "porcentaje_ocupacion": <número decimal 0-100>,
  "confianza": <número decimal 0-1>,
  "factores": ["<factor1>", "<factor2>", "<factor3>"],
  "recomendaciones": ["<recomendacion1>", "<recomendacion2>"]
}}"""

        texto = self._generar(prompt, max_tokens=512)
        return self._extraer_json(texto)

    def analizar_satisfaccion(self, datos_encuesta: Dict[str, Any]) -> Dict[str, Any]:
        total_asistentes = datos_encuesta.get("total_asistentes", 0)
        total_respuestas = datos_encuesta.get("total_respuestas", 0)
        tasa = (total_respuestas / total_asistentes * 100) if total_asistentes > 0 else 0

        respuestas_texto = "\n".join([
            f"- {r.get('pregunta')}: {r.get('respuesta')}"
            + (f" (puntaje: {r.get('puntaje')})" if r.get("puntaje") else "")
            for r in datos_encuesta.get("respuestas", [])
        ])

        prompt = f"""Eres un analista de experiencia en eventos. Analiza las respuestas de la encuesta post-evento.

Evento: {datos_encuesta.get('titulo')} ({datos_encuesta.get('tipo_evento')})
Total asistentes: {total_asistentes}
Respuestas recibidas: {total_respuestas} ({tasa:.1f}% de tasa de respuesta)

Respuestas de la encuesta:
{respuestas_texto}

Responde ÚNICAMENTE con este JSON sin explicaciones ni markdown:
{{
  "puntaje_promedio": <número 1.0-5.0>,
  "sentimiento_general": "<positivo|neutro|negativo>",
  "resumen": "<resumen ejecutivo del evento en 2-3 oraciones>",
  "puntos_positivos": ["<punto1>", "<punto2>", "<punto3>"],
  "puntos_mejora": ["<mejora1>", "<mejora2>", "<mejora3>"],
  "analisis_por_pregunta": [
    {{
      "pregunta": "<pregunta>",
      "conclusion": "<análisis breve>",
      "sentimiento": "<positivo|neutro|negativo>"
    }}
  ]
}}"""

        texto = self._generar(prompt, max_tokens=1024)
        return self._extraer_json(texto)

    async def analizar_publico(self, datos_publico: Dict[str, Any]) -> Dict[str, Any]:
        asistentes = datos_publico.get("asistentes", [])
        total = len(asistentes)

        # Construir resumen demográfico
        ciudades = {}
        provincias = {}
        paises = {}
        for a in asistentes:
            c = a.get("ciudad", "Desconocida")
            p = a.get("provincia", "Desconocida")
            pa = a.get("pais", "Desconocido")
            ciudades[c] = ciudades.get(c, 0) + 1
            provincias[p] = provincias.get(p, 0) + 1
            paises[pa] = paises.get(pa, 0) + 1

        demo_texto = f"""Distribución geográfica ({total} asistentes):
Ciudades: {', '.join(f'{k}: {v}' for k, v in sorted(ciudades.items(), key=lambda x: -x[1])[:10])}
Provincias: {', '.join(f'{k}: {v}' for k, v in sorted(provincias.items(), key=lambda x: -x[1])[:10])}
Países: {', '.join(f'{k}: {v}' for k, v in sorted(paises.items(), key=lambda x: -x[1])[:10])}"""

        prompt = f"""Eres un experto en análisis de audiencias y marketing de eventos.
Analiza la composición del público del siguiente evento.

Evento: {datos_publico.get('titulo')} ({datos_publico.get('tipo_evento')})
Total asistentes inscritos: {total}

{demo_texto}

Responde ÚNICAMENTE con este JSON sin explicaciones ni markdown:
{{
  "total_analizado": {total},
  "segmentos": [
    {{
      "nombre": "<nombre del segmento>",
      "porcentaje": <número decimal 0-100>,
      "descripcion": "<descripción breve del segmento>"
    }}
  ],
  "distribucion_geografica": {{
    "ciudad_principal": "<ciudad con más asistentes>",
    "concentracion_porcentaje": <% de asistentes en la ciudad principal>,
    "diversidad": "<alta|media|baja>"
  }},
  "perfil_predominante": "<descripción del perfil típico del asistente>",
  "insights": ["<insight1>", "<insight2>", "<insight3>"],
  "recomendaciones_marketing": ["<recomendación1>", "<recomendación2>", "<recomendación3>"]
}}"""

        texto = self._generar(prompt, max_tokens=1024)
        return self._extraer_json(texto)
