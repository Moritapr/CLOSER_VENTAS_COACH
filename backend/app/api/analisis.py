import traceback
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.services.analisis import analizar_llamada
from app.services.guardar import guardar_analisis, calcular_comparativa_historica
from app.core.auth import get_current_user_id

router = APIRouter(prefix="/api", tags=["analisis"])

class TranscripcionRequest(BaseModel):
    transcripcion: str
    nombre_archivo: str = None
    duracion_segundos: float = None

@router.post("/analizar")
async def analizar(request: TranscripcionRequest, user_id: str = Depends(get_current_user_id)):
    if not request.transcripcion or len(request.transcripcion) < 50:
        raise HTTPException(status_code=400, detail="Transcripción muy corta o vacía")
    try:
        resultado = await analizar_llamada(request.transcripcion)
        comparativa = await calcular_comparativa_historica(resultado["puntaje_general"], user_id)
        guardado = await guardar_analisis(
            transcripcion=request.transcripcion,
            analisis=resultado,
            user_id=user_id,
            nombre_archivo=request.nombre_archivo,
            duracion_segundos=request.duracion_segundos
        )
        return {"status": "ok", "id": guardado["id"], "analisis": resultado, **comparativa}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
