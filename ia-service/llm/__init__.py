from llm.gemini_adapter import GeminiAdapter

def get_adapter():
    """Retorna la instancia del adaptador LLM configurado.
    Cambiar aquí para usar otro proveedor (Claude, OpenAI, etc.)."""
    return GeminiAdapter()
