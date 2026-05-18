from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.analisis import analizar_llamada

router = APIRouter(prefix="/api", tags=["analisis"])

class TranscripcionRequest(BaseModel):
    transcripcion: str

@router.post("/analizar")
async def analizar(request: TranscripcionRequest):
    if not request.transcripcion or len(request.transcripcion) < 50:
        raise HTTPException(status_code=400, detail="Transcripción muy corta o vacía")
    try:
        resultado = await analizar_llamada(request.transcripcion)
        return {"status": "ok", "analisis": resultado}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en análisis: {str(e)}")
