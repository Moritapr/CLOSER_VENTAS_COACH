import os
import subprocess
import tempfile
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.services.transcripcion import transcribir
from app.core.auth import get_current_user_id

router = APIRouter(prefix="/api", tags=["upload"])

GROQ_MAX_BYTES = 25 * 1024 * 1024  # límite real de Groq para transcripción

# content_type -> file extension for temp file naming
CONTENT_TYPE_EXT = {
    "audio/mpeg": "mp3",  "audio/mp3":  "mp3",
    "audio/mp4":  "mp4",  "audio/m4a":  "mp4",  "audio/x-m4a": "mp4",
    "video/mp4":  "mp4",
    "audio/wav":  "wav",  "audio/x-wav": "wav",
    "audio/ogg":  "ogg",
    "audio/webm": "webm", "video/webm":  "webm",
}


def to_mp3(audio_bytes: bytes, content_type: str, filename: str) -> tuple[bytes, str]:
    # Siempre pasa por ffmpeg, incluso si el input ya es MP3: no es solo una
    # conversión de formato, es una compresión (mono/16kHz/32kbps) que reduce
    # el tamaño del archivo para transcripción. Un MP3 nativo grande (ej.
    # exportado en estéreo/alta calidad desde el celular) tenía el mismo
    # problema de tamaño que un WAV o M4A sin comprimir — el passthrough que
    # había acá antes lo dejaba pasar intacto y Groq lo rechazaba con 413.
    ext = CONTENT_TYPE_EXT.get(content_type, "")

    # Derive input extension from content_type or filename
    if not ext:
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "bin"

    tmp_in = tmp_out = None
    try:
        # Write raw bytes to a temp file with the correct extension so ffmpeg
        # can detect the container format reliably
        fd, tmp_in = tempfile.mkstemp(suffix=f".{ext}")
        os.write(fd, audio_bytes)
        os.close(fd)

        tmp_out = tmp_in.rsplit(".", 1)[0] + "_out.mp3"

        # Mono, 16kHz, 32kbps: de sobra para inteligibilidad de voz en
        # transcripción, muy por debajo de la calidad musical que usaba
        # -q:a 2 (~170-210kbps) y que hacía que llamadas largas superaran
        # el límite de 25MB de Groq sin necesidad.
        result = subprocess.run(
            ["ffmpeg", "-y", "-i", tmp_in, "-acodec", "libmp3lame", "-ac", "1", "-ar", "16000", "-b:a", "32k", tmp_out],
            capture_output=True,
            timeout=300,
        )

        if result.returncode != 0:
            stderr = result.stderr.decode(errors="replace")
            print(f"FFMPEG ERROR:\n{stderr}")
            raise HTTPException(
                status_code=422,
                detail=f"No se pudo convertir el archivo de audio '{filename}'. "
                       f"ffmpeg: {stderr[-300:]}",
            )

        with open(tmp_out, "rb") as f:
            mp3_bytes = f.read()

        mp3_name = (filename.rsplit(".", 1)[0] if "." in filename else filename) + ".mp3"
        return mp3_bytes, mp3_name

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail=f"No se pudo procesar el archivo de audio '{filename}': {e}",
        )
    finally:
        if tmp_in and os.path.exists(tmp_in):
            os.unlink(tmp_in)
        if tmp_out and os.path.exists(tmp_out):
            os.unlink(tmp_out)


@router.post("/upload")
async def subir_audio(archivo: UploadFile = File(...), user_id: str = Depends(get_current_user_id)):
    contenido = await archivo.read()
    print(f"ARCHIVO RECIBIDO: {len(contenido)} bytes, content_type={archivo.content_type}, filename={archivo.filename}")

    mp3_bytes, mp3_nombre = to_mp3(
        contenido,
        archivo.content_type or "",
        archivo.filename or "audio.mp3",
    )
    print(f"MP3 GENERADO: {len(mp3_bytes)} bytes, nombre={mp3_nombre}")

    if len(mp3_bytes) > GROQ_MAX_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Esta grabación es demasiado larga para procesarla. El límite aproximado es de 2 "
                   "horas. Intenta con una llamada más corta o divide la grabación.",
        )

    resultado = await transcribir(mp3_bytes, mp3_nombre)

    return {
        "status": "ok",
        "transcripcion": resultado["transcripcion"],
        "duracion_segundos": resultado["duracion_segundos"],
    }
