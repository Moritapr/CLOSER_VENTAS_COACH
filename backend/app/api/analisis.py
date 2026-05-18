import traceback
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.analisis import analizar_llamada
from app.services.guardar import guardar_analisis

router = APIRouter(prefix="/api", tags=["analisis"])

class TranscripcionRequest(BaseModel):
    transcripcion: str
    nombre_archivo: str = None
    duracion_segundos: float = None

@router.post("/analizar")
async def analizar(request: TranscripcionRequest):
    if not request.transcripcion or len(request.transcripcion) < 50:
        raise HTTPException(status_code=400, detail="Transcripción muy corta o vacía")
    try:
        resultado = await analizar_llamada(request.transcripcion)
        guardado = await guardar_analisis(
            transcripcion=request.transcripcion,
            analisis=resultado,
            nombre_archivo=request.nombre_archivo,
            duracion_segundos=request.duracion_segundos
        )
        return {"status": "ok", "id": guardado["id"], "analisis": resultado}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
