import traceback
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.services.extraccion import extraer_patrones
from app.services.referencias import guardar_referencia, listar_referencias, eliminar_referencia
from app.core.auth import get_current_user_id

router = APIRouter(prefix="/api", tags=["referencias"])

MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]


class ReferenciaRequest(BaseModel):
    transcripcion: str
    nombre_archivo: str = None
    duracion_segundos: float = None


def _fmt_date(ts: str) -> str:
    try:
        dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        return f"{dt.day} {MESES[dt.month - 1]}"
    except Exception:
        return "—"


def _fmt_duration(s) -> str:
    if not s:
        return "—"
    return f"{int(s // 60)}:{str(int(s % 60)).zfill(2)}"


def _contar_patrones(patrones: dict | None) -> dict:
    patrones = patrones or {}
    return {
        "objeciones": len(patrones.get("objeciones") or []),
        "manejoPrecio": len(patrones.get("manejo_precio") or []),
        "frasesClave": len(patrones.get("frases_clave") or []),
        "controlConversacion": len(patrones.get("control_conversacion") or []),
        "transiciones": len(patrones.get("transiciones") or []),
    }


@router.post("/referencias")
async def crear_referencia(request: ReferenciaRequest, user_id: str = Depends(get_current_user_id)):
    if not request.transcripcion or len(request.transcripcion) < 50:
        raise HTTPException(status_code=400, detail="Transcripción muy corta o vacía")
    try:
        patrones = await extraer_patrones(request.transcripcion)
        guardado = await guardar_referencia(
            transcripcion=request.transcripcion,
            patrones=patrones,
            user_id=user_id,
            nombre_archivo=request.nombre_archivo,
            duracion_segundos=request.duracion_segundos,
        )
        return {
            "status": "ok",
            "id": guardado["id"],
            "patrones": patrones,
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/referencias")
def listar(user_id: str = Depends(get_current_user_id)):
    rows = listar_referencias(user_id)
    referencias = [
        {
            "id": row["id"],
            "date": _fmt_date(row.get("created_at", "")),
            "fileName": row.get("nombre_archivo") or "referencia.mp3",
            "duration": _fmt_duration(row.get("duracion_segundos")),
            "conteo": _contar_patrones(row.get("patrones")),
        }
        for row in rows
    ]
    return {"referencias": referencias}


@router.delete("/referencias/{referencia_id}")
def eliminar(referencia_id: str, user_id: str = Depends(get_current_user_id)):
    eliminado = eliminar_referencia(referencia_id, user_id)
    if not eliminado:
        raise HTTPException(status_code=404, detail="Referencia no encontrada")
    return {"status": "ok"}
