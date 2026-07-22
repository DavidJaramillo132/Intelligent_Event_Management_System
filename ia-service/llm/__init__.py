import os
from llm.deepseek_adapter import DeepSeekAdapter
from llm.gemini_adapter import GeminiAdapter

def get_adapter():
    """Retorna el adaptador LLM según la key disponible.
    Prioridad: DeepSeek > Gemini."""
    if os.getenv("DeepSeek_API_KEY"):
        return DeepSeekAdapter()
    if os.getenv("GEMINI_API_KEY"):
        return GeminiAdapter()
    raise RuntimeError("No hay API key de LLM configurada (DeepSeek_API_KEY o GEMINI_API_KEY).")
