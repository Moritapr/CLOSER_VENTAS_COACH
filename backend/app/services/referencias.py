from app.db.supabase import supabase


async def guardar_referencia(
    transcripcion: str,
    patrones: dict,
    user_id: str,
    nombre_archivo: str = None,
    duracion_segundos: float = None,
) -> dict:
    registro = {
        "user_id": user_id,
        "nombre_archivo": nombre_archivo,
        "duracion_segundos": duracion_segundos,
        "transcripcion": transcripcion,
        "patrones": patrones,
    }
    resultado = supabase.table("referencias").insert(registro).execute()
    return resultado.data[0]


def listar_referencias(user_id: str) -> list[dict]:
    # Sin transcripcion: es un TEXT que puede ser grande (llamadas de horas)
    # y la lista solo necesita metadata + los patrones para contar.
    res = (
        supabase.table("referencias")
        .select("id,created_at,nombre_archivo,duracion_segundos,patrones")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return res.data or []


def eliminar_referencia(referencia_id: str, user_id: str) -> bool:
    # Filtrado por user_id además del id: el backend usa la service_role key,
    # que salta RLS, así que la verificación de pertenencia tiene que estar
    # acá en el código — mismo patrón que guardar.py.
    resultado = (
        supabase.table("referencias")
        .delete()
        .eq("id", referencia_id)
        .eq("user_id", user_id)
        .execute()
    )
    return len(resultado.data or []) > 0
