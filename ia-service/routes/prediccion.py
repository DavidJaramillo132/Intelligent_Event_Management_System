from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from llm import get_adapter

router = APIRouter()


class PrediccionInput(BaseModel):
    evento_id: str
    titulo: str
    tipo_evento: str
    capacidad: int
    costo: float
    fecha_inicio: str
    lugar: str
    ciudad: str
    eventos_previos: list[dict] = []  # historial de eventos similares


class PrediccionResponse(BaseModel):
    evento_id: str
    asistencia_predicha: int
    porcentaje_ocupacion: float
    confianza: float
    factores: list[str]
    recomendaciones: list[str]


@router.post("/", response_model=PrediccionResponse)
def predecir_asistencia(data: PrediccionInput):
    try:
        adapter = get_adapter()
        result = adapter.predecir_asistencia(data.model_dump())

        return PrediccionResponse(
            evento_id=data.evento_id,
            **result
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en predicción de IA: {str(e)}")