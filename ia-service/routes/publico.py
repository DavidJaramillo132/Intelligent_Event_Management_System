from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from llm import get_adapter

router = APIRouter()


class AsistenteInfo(BaseModel):
    nombre: str
    ciudad: str = ""
    provincia: str = ""
    pais: str = "Ecuador"


class PublicoInput(BaseModel):
    evento_id: str
    titulo: str
    tipo_evento: str
    asistentes: list[AsistenteInfo]


class DistribucionGeografica(BaseModel):
    ciudad_principal: str
    concentracion_porcentaje: float
    diversidad: str


class Segmento(BaseModel):
    nombre: str
    porcentaje: float
    descripcion: str


class PublicoResponse(BaseModel):
    evento_id: str
    total_analizado: int
    segmentos: list[Segmento]
    distribucion_geografica: DistribucionGeografica
    perfil_predominante: str
    insights: list[str]
    recomendaciones_marketing: list[str]


@router.post("/", response_model=PublicoResponse)
async def analizar_publico(data: PublicoInput):
    try:
        adapter = get_adapter()
        result = await adapter.analizar_publico(data.model_dump())

        return PublicoResponse(
            evento_id=data.evento_id,
            **result
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en análisis de público: {str(e)}")
