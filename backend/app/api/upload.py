import io
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydub import AudioSegment
from app.services.transcripcion import transcribir

router = APIRouter(prefix="/api", tags=["upload"])

# content_type -> pydub format hint (best-effort; falls back to file extension)
PYDUB_FORMAT = {
    "audio/mpeg": "mp3",  "audio/mp3":  "mp3",
    "audio/mp4":  "mp4",  "audio/m4a":  "mp4",  "audio/x-m4a": "mp4",
    "video/mp4":  "mp4",
    "audio/wav":  "wav",  "audio/x-wav": "wav",
    "audio/ogg":  "ogg",
    "audio/webm": "webm", "video/webm":  "webm",
}


def to_mp3(audio_bytes: bytes, content_type: str, filename: str) -> tuple[bytes, str]:
    fmt = PYDUB_FORMAT.get(content_type, "")

    # Passthrough for native MP3
    if fmt == "mp3":
        return audio_bytes, filename

    # Fall back to file extension, then let pydub auto-detect
    if not fmt:
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        fmt = ext or None

    try:
        audio = AudioSegment.from_file(io.BytesIO(audio_bytes), format=fmt)
        out = io.BytesIO()
        audio.export(out, format="mp3")
        mp3_name = (filename.rsplit(".", 1)[0] if "." in filename else filename) + ".mp3"
        return out.getvalue(), mp3_name
    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail=f"No se pudo procesar el archivo de audio '{filename}': {e}. "
                   "Asegurate de subir un archivo de audio válido (MP3, WAV, M4A, MP4, OGG).",
        )


@router.post("/upload")
async def subir_audio(archivo: UploadFile = File(...)):
    contenido = await archivo.read()
    print(f"ARCHIVO RECIBIDO: {len(contenido)} bytes, content_type={archivo.content_type}, filename={archivo.filename}")
    mp3_bytes, mp3_nombre = to_mp3(
        contenido,
        archivo.content_type or "",
        archivo.filename or "audio.mp3",
    )
    print(f"MP3 GENERADO: {len(mp3_bytes)} bytes, nombre={mp3_nombre}")
    resultado = await transcribir(mp3_bytes, mp3_nombre)

    return {
        "status": "ok",
        "transcripcion": resultado["transcripcion"],
        "duracion_segundos": resultado["duracion_segundos"],
    }
