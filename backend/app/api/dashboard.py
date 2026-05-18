from fastapi import APIRouter
from app.db.supabase import supabase
from datetime import datetime, timezone
from collections import defaultdict

router = APIRouter(prefix="/api", tags=["dashboard"])

PHASES = [
    (1, "Introducción"),
    (2, "Descubrimiento"),
    (3, "Licencia"),
    (4, "Calificación"),
    (5, "Oferta IUL"),
    (6, "Finanzas"),
    (7, "Cierre"),
]

MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"]

def fmt_date(ts: str) -> str:
    try:
        dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        return f"{dt.day} {MESES[dt.month - 1]}"
    except Exception:
        return "—"

def fmt_duration(s) -> str:
    if not s:
        return "—"
    return f"{int(s // 60)}:{str(int(s % 60)).zfill(2)}"

def weakest_phase(row: dict) -> str:
    worst_name, worst_puntaje = "—", 11
    for n, name in PHASES:
        if not row.get(f"fase_{n}_realizado"):
            puntaje = row.get(f"fase_{n}_puntaje") or 0
            if puntaje < worst_puntaje:
                worst_puntaje = puntaje
                worst_name = name
    return worst_name


@router.get("/dashboard")
def dashboard():
    res = supabase.table("analisis").select(
        "id,created_at,nombre_archivo,duracion_segundos,puntaje_general,"
        "fase_1_puntaje,fase_1_realizado,fase_2_puntaje,fase_2_realizado,"
        "fase_3_puntaje,fase_3_realizado,fase_4_puntaje,fase_4_realizado,"
        "fase_5_puntaje,fase_5_realizado,fase_6_puntaje,fase_6_realizado,"
        "fase_7_puntaje,fase_7_realizado,analisis_completo"
    ).order("created_at", desc=True).execute()
    rows = res.data or []

    # ── Call history ──────────────────────────────────────────────────────────
    calls = [
        {
            "id": row["id"],
            "date": fmt_date(row.get("created_at", "")),
            "fileName": row.get("nombre_archivo") or "llamada.mp3",
            "duration": fmt_duration(row.get("duracion_segundos")),
            "score": (row.get("puntaje_general") or 0) * 10,
            "weakestPhase": weakest_phase(row),
        }
        for row in rows
    ]

    # ── Weekly scores (last 6 ISO weeks with data) ────────────────────────────
    weekly: dict = defaultdict(list)
    current_yw = datetime.now(timezone.utc).isocalendar()[:2]
    for row in rows:
        try:
            dt = datetime.fromisoformat(row["created_at"].replace("Z", "+00:00"))
            yw = dt.isocalendar()[:2]
            weekly[yw].append((row.get("puntaje_general") or 0) * 10)
        except Exception:
            pass

    sorted_weeks = sorted(weekly.keys())[-6:]
    weekly_scores = []
    for i, yw in enumerate(sorted_weeks):
        scores = weekly[yw]
        label = "Esta" if yw == current_yw else f"Sem {i + 1}"
        weekly_scores.append({"label": label, "score": round(sum(scores) / len(scores))})

    # ── Phase fails ───────────────────────────────────────────────────────────
    total = len(rows)
    fail_counts: dict = defaultdict(int)
    for row in rows:
        for n, name in PHASES:
            if not row.get(f"fase_{n}_realizado"):
                fail_counts[name] += 1

    phase_fails = sorted(
        [{"name": name, "failCount": cnt, "total": total} for name, cnt in fail_counts.items()],
        key=lambda x: x["failCount"],
        reverse=True,
    )[:4]

    # ── Top objections (extracted from analisis_completo JSONB) ───────────────
    obj_counts: dict = defaultdict(int)
    for row in rows:
        ac = row.get("analisis_completo") or {}
        for obj in ac.get("objeciones_detectadas", []):
            key = (obj.get("objecion") or "").strip()
            if key:
                obj_counts[key] += 1

    top_objections = [
        {"type": k, "count": v, "handledCount": 0}
        for k, v in sorted(obj_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    ]

    return {
        "calls": calls,
        "weeklyScores": weekly_scores,
        "phaseFails": phase_fails,
        "topObjections": top_objections,
    }
