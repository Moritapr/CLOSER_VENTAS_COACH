from fastapi import HTTPException
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


async def transcribir_segmentos(segmentos: list[tuple[bytes, str]]) -> dict:
    """Transcribe una lista ORDENADA de segmentos (bytes, nombre) y devuelve
    el texto completo unido + la suma de las duraciones de cada segmento
    (que es la duración real del audio completo, no la de un segmento).

    Si falla un segmento, no devolvemos una transcripción parcial en
    silencio: cortamos ahí mismo con un error que dice cuál segmento falló,
    para que quede claro que hay que reintentar la subida completa.
    """
    total = len(segmentos)
    textos: list[str] = []
    duracion_total = 0

    for i, (segmento_bytes, nombre_segmento) in enumerate(segmentos, start=1):
        try:
            resultado = await transcribir(segmento_bytes, nombre_segmento)
        except Exception as e:
            raise HTTPException(
                status_code=502,
                detail=f"Falló la transcripción del segmento {i} de {total} "
                       f"('{nombre_segmento}'): {e}. No se generó un análisis "
                       f"parcial — intenta subir la grabación de nuevo.",
            ) from e

        textos.append(resultado["transcripcion"].strip())
        duracion_total += resultado["duracion_segundos"]

    # Salto de línea doble entre segmentos: nunca pega dos palabras aunque
    # el texto de un segmento no termine con espacio, y separa visualmente
    # cada tramo de 15-20 minutos en el texto final.
    transcripcion_completa = "\n\n".join(t for t in textos if t)

    return {
        "transcripcion": transcripcion_completa,
        "duracion_segundos": duracion_total,
    }
