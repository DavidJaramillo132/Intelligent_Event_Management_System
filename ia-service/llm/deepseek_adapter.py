import os
import json
import re
from typing import Dict, Any

from openai import OpenAI
from llm.base_adaptador import LLMAdapter


class DeepSeekAdapter(LLMAdapter):
    """Adaptador DeepSeek — compatible con la API de OpenAI."""

    def __init__(self):
        api_key = os.getenv("DeepSeek_API_KEY")
        if not api_key:
            raise ValueError("DeepSeek_API_KEY no está configurada en las variables de entorno.")

        self.client = OpenAI(
            api_key=api_key,
            base_url="https://api.deepseek.com",
        )
        self.model = "deepseek-chat"

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _extraer_json(self, texto: str) -> dict:
        texto = texto.strip()
        match = re.search(r"```(?:json)?\s*([\s\S]*?)```", texto)
        if match:
            texto = match.group(1).strip()
        return json.loads(texto)

    def _chat(self, system: str, user: str, max_tokens: int = 1024) -> str:
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user",   "content": user},
            ],
            max_tokens=max_tokens,
            temperature=0.3,
        )
        return response.choices[0].message.content or ""

    # ── Métodos del adaptador base ────────────────────────────────────────────

    def predecir_asistencia(self, datos_evento: Dict[str, Any]) -> Dict[str, Any]:
        eventos_previos = datos_evento.get("eventos_previos", [])
        historial = "\n".join([
            f"- {e.get('titulo')}: {e.get('asistentes')}/{e.get('capacidad')} asistentes"
            for e in eventos_previos
        ]) if eventos_previos else "Sin historial previo disponible."

        system = "Eres un experto en análisis de eventos. Respondes ÚNICAMENTE con JSON válido, sin markdown."
        user = f"""Analiza los datos y predice la asistencia.

Evento:
- Título: {datos_evento.get('titulo')}
- Tipo: {datos_evento.get('tipo_evento')}
- Capacidad: {datos_evento.get('capacidad')}
- Costo: ${datos_evento.get('costo')}
- Fecha: {datos_evento.get('fecha_inicio')}
- Lugar: {datos_evento.get('lugar')}, {datos_evento.get('ciudad')}

Historial:
{historial}

Responde SOLO con este JSON:
{{
  "asistencia_predicha": <entero>,
  "porcentaje_ocupacion": <decimal 0-100>,
  "confianza": <decimal 0-1>,
  "factores": ["<f1>", "<f2>", "<f3>"],
  "recomendaciones": ["<r1>", "<r2>"]
}}"""
        return self._extraer_json(self._chat(system, user, 512))

    def analizar_satisfaccion(self, datos_encuesta: Dict[str, Any]) -> Dict[str, Any]:
        total_a = datos_encuesta.get("total_asistentes", 0)
        total_r = datos_encuesta.get("total_respuestas", 0)
        tasa = (total_r / total_a * 100) if total_a > 0 else 0
        respuestas_texto = "\n".join([
            f"- {r.get('pregunta')}: {r.get('respuesta')}"
            + (f" (puntaje: {r.get('puntaje')})" if r.get("puntaje") else "")
            for r in datos_encuesta.get("respuestas", [])
        ])

        system = "Eres un analista de experiencia en eventos. Respondes ÚNICAMENTE con JSON válido, sin markdown."
        user = f"""Analiza las respuestas de la encuesta.

Evento: {datos_encuesta.get('titulo')} ({datos_encuesta.get('tipo_evento')})
Asistentes: {total_a} | Respuestas: {total_r} ({tasa:.1f}%)

{respuestas_texto}

Responde SOLO con este JSON:
{{
  "puntaje_promedio": <1.0-5.0>,
  "sentimiento_general": "<positivo|neutro|negativo>",
  "resumen": "<2-3 oraciones>",
  "puntos_positivos": ["<p1>", "<p2>", "<p3>"],
  "puntos_mejora": ["<m1>", "<m2>", "<m3>"],
  "analisis_por_pregunta": [{{"pregunta": "", "conclusion": "", "sentimiento": ""}}]
}}"""
        return self._extraer_json(self._chat(system, user, 1024))

    async def analizar_publico(self, datos_publico: Dict[str, Any]) -> Dict[str, Any]:
        asistentes = datos_publico.get("asistentes", [])
        total = len(asistentes)
        ciudades: Dict[str, int] = {}
        provincias: Dict[str, int] = {}
        paises: Dict[str, int] = {}
        for a in asistentes:
            for d, k in [(ciudades, "ciudad"), (provincias, "provincia"), (paises, "pais")]:
                v = a.get(k, "Desconocido")
                d[v] = d.get(v, 0) + 1

        demo = (
            f"Ciudades: {', '.join(f'{k}:{v}' for k,v in sorted(ciudades.items(), key=lambda x:-x[1])[:8])}\n"
            f"Provincias: {', '.join(f'{k}:{v}' for k,v in sorted(provincias.items(), key=lambda x:-x[1])[:6])}\n"
            f"Países: {', '.join(f'{k}:{v}' for k,v in sorted(paises.items(), key=lambda x:-x[1])[:5])}"
        )

        system = "Eres un experto en análisis de audiencias. Respondes ÚNICAMENTE con JSON válido, sin markdown."
        user = f"""Analiza el público del evento.

Evento: {datos_publico.get('titulo')} ({datos_publico.get('tipo_evento')})
Total: {total}

{demo}

Responde SOLO con este JSON:
{{
  "total_analizado": {total},
  "segmentos": [{{"nombre":"","porcentaje":0.0,"descripcion":""}}],
  "distribucion_geografica": {{"ciudad_principal":"","concentracion_porcentaje":0.0,"diversidad":""}},
  "perfil_predominante": "",
  "insights": ["<i1>","<i2>","<i3>"],
  "recomendaciones_marketing": ["<r1>","<r2>","<r3>"]
}}"""
        return self._extraer_json(self._chat(system, user, 1024))
