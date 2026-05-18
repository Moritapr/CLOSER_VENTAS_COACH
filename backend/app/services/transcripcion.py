from groq import Groq
from app.core.config import settings

_client = Groq(api_key=settings.GROQ_API_KEY)


async def transcribir(archivo_bytes: bytes, nombre_archivo: str) -> dict:
    """Transcribe an audio file via Groq Whisper and return text + duration."""
    transcripcion = _client.audio.transcriptions.create(
        model="whisper-large-v3",
        file=(nombre_archivo, archivo_bytes, "audio/mpeg"),
        response_format="verbose_json",
    )
    return {
        "transcripcion": transcripcion.text,
        "duracion_segundos": int(getattr(transcripcion, "duration", 0)),
    }
