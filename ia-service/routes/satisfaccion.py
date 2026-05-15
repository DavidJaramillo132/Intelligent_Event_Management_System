from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from llm import get_adapter

router = APIRouter()


class RespuestaEncuesta(BaseModel):
    pregunta: str
    respuesta: str
    puntaje: float | None = None    # 1-5 si es escala numérica


class SatisfaccionInput(BaseModel):
    evento_id: str
    titulo: str
    tipo_evento: str
    total_asistentes: int
    total_respuestas: int
    respuestas: list[RespuestaEncuesta]


class SatisfaccionResponse(BaseModel):
    evento_id: str
    puntaje_promedio: float
    sentimiento_general: str        # "positivo" | "neutro" | "negativo"
    resumen: str
    puntos_positivos: list[str]
    puntos_mejora: list[str]
    tasa_respuesta: float
    analisis_por_pregunta: list[dict]


@router.post("/", response_model=SatisfaccionResponse)
def analizar_satisfaccion(data: SatisfaccionInput):
    try:
        tasa = (data.total_respuestas / data.total_asistentes * 100) if data.total_asistentes > 0 else 0

        adapter = get_adapter()
        result = adapter.analizar_satisfaccion(data.model_dump())

        return SatisfaccionResponse(
            evento_id=data.evento_id,
            tasa_respuesta=round(tasa, 2),
            **result
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en análisis de satisfacción: {str(e)}")
