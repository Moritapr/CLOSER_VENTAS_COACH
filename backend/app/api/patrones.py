from fastapi import APIRouter
from app.db.supabase import supabase
from app.services.analisis import _criterio_ocurrio, PENALIZACIONES_DOMINIO

router = APIRouter(prefix="/api", tags=["patrones"])

MIN_LLAMADAS_PARA_PATRON = 4
LIMITE_LLAMADAS = 10
UMBRAL_PATRON = 0.5


@router.get("/patrones")
def patrones():
    res = (
        supabase.table("analisis")
        .select("analisis_completo")
        .order("created_at", desc=True)
        .limit(LIMITE_LLAMADAS)
        .execute()
    )
    rows = res.data or []
    total = len(rows)

    if total < MIN_LLAMADAS_PARA_PATRON:
        return {"total_llamadas_analizadas": total, "patrones": []}

    conteos = {criterio: 0 for criterio in PENALIZACIONES_DOMINIO}
    for row in rows:
        analisis_completo = row.get("analisis_completo") or {}
        evaluacion_dominio = analisis_completo.get("evaluacion_dominio") or {}
        for criterio in conteos:
            if _criterio_ocurrio(evaluacion_dominio.get(criterio)):
                conteos[criterio] += 1

    patrones_detectados = [
        {
            "criterio": criterio,
            "veces": veces,
            "de": total,
            "porcentaje": round(veces / total * 100),
        }
        for criterio, veces in conteos.items()
        if veces / total >= UMBRAL_PATRON
    ]
    patrones_detectados.sort(key=lambda p: p["veces"], reverse=True)

    return {"total_llamadas_analizadas": total, "patrones": patrones_detectados}
