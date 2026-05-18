import io
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydub import AudioSegment
from app.services.transcripcion import transcribir

router = APIRouter(prefix="/api", tags=["upload"])

FORMATOS_PERMITIDOS = {
    "audio/mpeg", "audio/mp3",
    "audio/mp4", "audio/m4a", "audio/x-m4a",
    "audio/wav",  "audio/x-wav",
    "audio/ogg",  "audio/webm",
    "video/mp4",  "video/webm",
}

# content_type -> pydub format string
PYDUB_FORMAT = {
    "audio/mpeg": "mp3",  "audio/mp3":  "mp3",
    "audio/mp4":  "mp4",  "audio/m4a":  "mp4",  "audio/x-m4a": "mp4",
    "video/mp4":  "mp4",
    "audio/wav":  "wav",  "audio/x-wav": "wav",
    "audio/ogg":  "ogg",
    "audio/webm": "webm", "video/webm":  "webm",
}


def to_mp3(audio_bytes: bytes, content_type: str, filename: str) -> tuple[bytes, str]:
    """Convert any supported audio format to MP3. Passthrough if already MP3."""
    fmt = PYDUB_FORMAT.get(content_type, "")

    # Passthrough for native MP3
    if fmt == "mp3":
        return audio_bytes, filename

    # Fall back to extension if content_type is unknown
    if not fmt:
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        fmt = ext or "mp3"

    try:
        audio = AudioSegment.from_file(io.BytesIO(audio_bytes), format=fmt)
        out = io.BytesIO()
        audio.export(out, format="mp3")
        mp3_name = (filename.rsplit(".", 1)[0] if "." in filename else filename) + ".mp3"
        return out.getvalue(), mp3_name
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"No se pudo convertir el audio: {e}")


@router.post("/upload")
async def subir_audio(archivo: UploadFile = File(...)):
    if archivo.content_type not in FORMATOS_PERMITIDOS:
        raise HTTPException(
            status_code=400,
            detail="Formato no permitido. Usa MP3, MP4, WAV, M4A u OGG",
        )

    contenido = await archivo.read()
    mp3_bytes, mp3_nombre = to_mp3(contenido, archivo.content_type or "", archivo.filename or "audio.mp3")
    resultado = await transcribir(mp3_bytes, mp3_nombre)

    return {
        "status": "ok",
        "transcripcion": resultado["transcripcion"],
        "duracion_segundos": resultado["duracion_segundos"],
    }
