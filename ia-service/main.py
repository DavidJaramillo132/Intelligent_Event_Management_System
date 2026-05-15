from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routes import (
    prediccion,
    satisfaccion,
    publico,
)

app = FastAPI(
    title="AI Services",
    description="Microservice of AI for events",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Go backend es el único que llama aquí
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(prediccion.router,     prefix="/ia/prediccion",     tags=["Predicción de asistencia"])
app.include_router(satisfaccion.router,   prefix="/ia/satisfaccion",   tags=["Análisis de satisfacción"])
app.include_router(publico.router,        prefix="/ia/publico",        tags=["Análisis de público"])

@app.get("/health")
def health():
    return {"ok": True, "service": "ia-service"}