import os
import uuid
import aiofiles
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.transcripcion import transcribir_audio

router = APIRouter(prefix="/api", tags=["upload"])

UPLOAD_DIR = "/tmp/audios"
os.makedirs(UPLOAD_DIR, exist_ok=True)

FORMATOS_PERMITIDOS = {"audio/mpeg", "audio/mp4", "audio/wav", "audio/m4a"}

@router.post("/upload")
async def subir_audio(archivo: UploadFile = File(...)):
    if archivo.content_type not in FORMATOS_PERMITIDOS:
        raise HTTPException(status_code=400, detail="Formato no permitido. Usa MP3, MP4, WAV o M4A")

    nombre = f"{uuid.uuid4()}_{archivo.filename}"
    ruta = f"{UPLOAD_DIR}/{nombre}"

    async with aiofiles.open(ruta, "wb") as f:
        contenido = await archivo.read()
        await f.write(contenido)

    try:
        resultado = await transcribir_audio(ruta)
    finally:
        os.remove(ruta)

    return {
        "status": "ok",
        "transcripcion": resultado["texto"],
        "duracion_segundos": resultado["duracion"],
        "idioma": resultado["idioma"]
    }
