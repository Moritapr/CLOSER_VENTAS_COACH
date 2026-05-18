from openai import AsyncOpenAI
from app.core.config import settings

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

async def transcribir_audio(ruta_archivo: str) -> dict:
    with open(ruta_archivo, "rb") as audio:
        respuesta = await client.audio.transcriptions.create(
            model="whisper-1",
            file=audio,
            language="es",
            response_format="verbose_json"
        )
    return {
        "texto": respuesta.text,
        "duracion": respuesta.duration,
        "idioma": respuesta.language
    }
