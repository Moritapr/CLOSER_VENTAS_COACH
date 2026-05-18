from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.transcripcion import transcribir

router = APIRouter(prefix="/api", tags=["upload"])

FORMATOS_PERMITIDOS = {"audio/mpeg", "audio/mp4", "audio/wav", "audio/m4a", "audio/x-m4a"}

@router.post("/upload")
async def subir_audio(archivo: UploadFile = File(...)):
    if archivo.content_type not in FORMATOS_PERMITIDOS:
        raise HTTPException(
            status_code=400,
            detail="Formato no permitido. Usa MP3, MP4, WAV o M4A",
        )

    contenido = await archivo.read()
    resultado = await transcribir(contenido, archivo.filename or "audio.mp3")

    return {
        "status": "ok",
        "transcripcion": resultado["transcripcion"],
        "duracion_segundos": resultado["duracion_segundos"],
    }
