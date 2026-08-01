import glob
import os
import shutil
import subprocess
import tempfile
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.services.transcripcion import transcribir, transcribir_segmentos
from app.core.auth import get_current_user_id

router = APIRouter(prefix="/api", tags=["upload"])

# Groq rechaza archivos de más de 25MB. Usamos 20MB como umbral para decidir
# si segmentar — deja margen de sobra, así que en la práctica ya no hay un
# límite de duración: una llamada de 3 horas simplemente se parte en más
# segmentos.
SEGMENTAR_UMBRAL_BYTES = 20 * 1024 * 1024

# 15 minutos por segmento (dentro del rango de 15-20 min pedido). Con la
# compresión a 32kbps CBR eso da segmentos de ~3.4MB, muy por debajo de
# cualquier límite — el margen es a propósito para que un segmento nunca
# necesite volver a partirse.
SEGMENTO_DURACION_SEGUNDOS = 900

# Cuando la duración total es (casi) múltiplo exacto del tamaño de segmento,
# el muxer 'segment' de ffmpeg puede dejar un último archivo residual de
# unos cientos de bytes (fracciones de segundo, sin audio real) — probado
# con un input de exactamente 2h30m, que dio un segmento 11 de 513 bytes.
# Se descarta cualquier segmento por debajo de ~1s de audio a 32kbps.
SEGMENTO_BYTES_MINIMOS = 4000

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


def segmentar_mp3(mp3_bytes: bytes) -> list[bytes]:
    """Parte un MP3 ya comprimido en segmentos de SEGMENTO_DURACION_SEGUNDOS
    usando el muxer 'segment' de ffmpeg con -c copy (remux, sin recodificar
    — rápido y sin pérdida de calidad extra). Devuelve los segmentos en
    orden, listos para transcribir uno por uno."""
    tmp_in = tmp_dir = None
    try:
        fd, tmp_in = tempfile.mkstemp(suffix=".mp3")
        os.write(fd, mp3_bytes)
        os.close(fd)

        tmp_dir = tempfile.mkdtemp()
        patron_salida = os.path.join(tmp_dir, "segmento_%03d.mp3")

        result = subprocess.run(
            [
                "ffmpeg", "-y", "-i", tmp_in,
                "-f", "segment", "-segment_time", str(SEGMENTO_DURACION_SEGUNDOS),
                "-c", "copy", "-reset_timestamps", "1",
                patron_salida,
            ],
            capture_output=True,
            timeout=600,
        )

        if result.returncode != 0:
            stderr = result.stderr.decode(errors="replace")
            print(f"FFMPEG SEGMENT ERROR:\n{stderr}")
            raise HTTPException(
                status_code=422,
                detail=f"No se pudo partir el audio en segmentos. ffmpeg: {stderr[-300:]}",
            )

        rutas_segmento = sorted(glob.glob(os.path.join(tmp_dir, "segmento_*.mp3")))
        if not rutas_segmento:
            raise HTTPException(
                status_code=422,
                detail="No se generó ningún segmento de audio — revisa el archivo original.",
            )

        segmentos = []
        for ruta in rutas_segmento:
            with open(ruta, "rb") as f:
                datos = f.read()
            if len(datos) < SEGMENTO_BYTES_MINIMOS:
                print(f"SEGMENTO DESCARTADO (residual, {len(datos)} bytes): {os.path.basename(ruta)}")
                continue
            segmentos.append(datos)

        if not segmentos:
            raise HTTPException(
                status_code=422,
                detail="No se generó ningún segmento de audio con contenido — revisa el archivo original.",
            )
        return segmentos

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail=f"No se pudo partir el audio en segmentos: {e}",
        )
    finally:
        if tmp_in and os.path.exists(tmp_in):
            os.unlink(tmp_in)
        if tmp_dir and os.path.exists(tmp_dir):
            shutil.rmtree(tmp_dir, ignore_errors=True)


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

    if len(mp3_bytes) <= SEGMENTAR_UMBRAL_BYTES:
        # Camino normal, sin overhead extra: un solo envío a Groq, igual que
        # siempre.
        resultado = await transcribir(mp3_bytes, mp3_nombre)
    else:
        segmentos_bytes = segmentar_mp3(mp3_bytes)
        print(
            f"AUDIO SEGMENTADO: {len(segmentos_bytes)} segmentos, "
            f"tamaños={[len(s) for s in segmentos_bytes]} bytes"
        )
        base_nombre = mp3_nombre.rsplit(".", 1)[0] if "." in mp3_nombre else mp3_nombre
        segmentos = [
            (seg_bytes, f"{base_nombre}_parte{i}.mp3")
            for i, seg_bytes in enumerate(segmentos_bytes, start=1)
        ]
        resultado = await transcribir_segmentos(segmentos)

    return {
        "status": "ok",
        "transcripcion": resultado["transcripcion"],
        "duracion_segundos": resultado["duracion_segundos"],
    }
