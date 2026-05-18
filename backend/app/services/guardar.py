from app.db.supabase import supabase

async def guardar_analisis(
    transcripcion: str,
    analisis: dict,
    nombre_archivo: str = None,
    duracion_segundos: float = None
) -> dict:
    fases = analisis.get("fases", {})

    registro = {
        "nombre_archivo": nombre_archivo,
        "duracion_segundos": duracion_segundos,
        "transcripcion": transcripcion,
        "puntaje_general": analisis.get("puntaje_general"),
        "resultado": analisis.get("resultado"),
        "fase_1_puntaje": fases.get("fase_1_introduccion", {}).get("puntaje"),
        "fase_1_realizado": fases.get("fase_1_introduccion", {}).get("realizado"),
        "fase_1_feedback": fases.get("fase_1_introduccion", {}).get("feedback"),
        "fase_2_puntaje": fases.get("fase_2_descubrimiento", {}).get("puntaje"),
        "fase_2_realizado": fases.get("fase_2_descubrimiento", {}).get("realizado"),
        "fase_2_feedback": fases.get("fase_2_descubrimiento", {}).get("feedback"),
        "fase_3_puntaje": fases.get("fase_3_licencia", {}).get("puntaje"),
        "fase_3_realizado": fases.get("fase_3_licencia", {}).get("realizado"),
        "fase_3_feedback": fases.get("fase_3_licencia", {}).get("feedback"),
        "fase_4_puntaje": fases.get("fase_4_calificacion", {}).get("puntaje"),
        "fase_4_realizado": fases.get("fase_4_calificacion", {}).get("realizado"),
        "fase_4_feedback": fases.get("fase_4_calificacion", {}).get("feedback"),
        "fase_5_puntaje": fases.get("fase_5_oferta", {}).get("puntaje"),
        "fase_5_realizado": fases.get("fase_5_oferta", {}).get("realizado"),
        "fase_5_feedback": fases.get("fase_5_oferta", {}).get("feedback"),
        "fase_6_puntaje": fases.get("fase_6_finanzas", {}).get("puntaje"),
        "fase_6_realizado": fases.get("fase_6_finanzas", {}).get("realizado"),
        "fase_6_feedback": fases.get("fase_6_finanzas", {}).get("feedback"),
        "fase_7_puntaje": fases.get("fase_7_cierre", {}).get("puntaje"),
        "fase_7_realizado": fases.get("fase_7_cierre", {}).get("realizado"),
        "fase_7_feedback": fases.get("fase_7_cierre", {}).get("feedback"),
        "fortalezas": analisis.get("fortalezas"),
        "areas_de_mejora": analisis.get("areas_de_mejora"),
        "consejo_principal": analisis.get("consejo_principal"),
        "analisis_completo": analisis
    }

    resultado = supabase.table("analisis").insert(registro).execute()
    return resultado.data[0]
