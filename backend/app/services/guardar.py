from app.db.supabase import supabase


async def calcular_comparativa_historica(puntaje_actual: int, user_id: str) -> dict:
    # Se llama ANTES de insertar la llamada actual, así el promedio nunca
    # se cuenta a sí mismo — sin importar si guardar_analisis termina
    # insertando una fila nueva o devolviendo un duplicado existente.
    # Filtrado por user_id: el backend usa la service_role key, que salta
    # RLS, así que el filtro tiene que estar acá en el código.
    res = (
        supabase.table("analisis")
        .select("puntaje_general")
        .eq("user_id", user_id)
        .execute()
    )
    puntajes = [
        row["puntaje_general"] for row in (res.data or [])
        if row.get("puntaje_general") is not None
    ]
    total = len(puntajes)

    if total < 3:
        return {
            "promedio_historico": None,
            "diferencia_vs_promedio": None,
            "total_llamadas_previas": total,
        }

    promedio = sum(puntajes) / total
    return {
        "promedio_historico": round(promedio, 1),
        "diferencia_vs_promedio": round(puntaje_actual - promedio, 1),
        "total_llamadas_previas": total,
    }


async def guardar_analisis(
    transcripcion: str,
    analisis: dict,
    user_id: str,
    nombre_archivo: str = None,
    duracion_segundos: float = None
) -> dict:
    fases = analisis.get("fases", {})

    registro = {
        "user_id": user_id,
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

    if nombre_archivo and duracion_segundos is not None:
        existing = (
            supabase.table("analisis")
            .select("*")
            .eq("user_id", user_id)
            .eq("nombre_archivo", nombre_archivo)
            .eq("duracion_segundos", duracion_segundos)
            .limit(1)
            .execute()
        )
        if existing.data:
            print(f"DUPLICADO: '{nombre_archivo}' ya existe (id={existing.data[0]['id']}), omitiendo inserción")
            return existing.data[0]

    resultado = supabase.table("analisis").insert(registro).execute()
    return resultado.data[0]
