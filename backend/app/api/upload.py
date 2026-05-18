import os
import subprocess
import tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.transcripcion import transcribir

router = APIRouter(prefix="/api", tags=["upload"])

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
    # Passthrough for native MP3 — no conversion needed
    ext = CONTENT_TYPE_EXT.get(content_type, "")
    if ext == "mp3":
        return audio_bytes, filename

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

        result = subprocess.run(
            ["ffmpeg", "-y", "-i", tmp_in, "-acodec", "libmp3lame", "-q:a", "2", tmp_out],
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
