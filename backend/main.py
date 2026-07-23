from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.upload import router as upload_router
from app.api.analisis import router as analisis_router
from app.api.dashboard import router as dashboard_router

app = FastAPI(
    title="Closer Ventas Coach API",
    description="Análisis de grabaciones de ventas IUL con IA",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://closer-ventas-coach.vercel.app"],
    # Previews de Vercel de este proyecto puntual (ej. https://closer-ventas-coach-git-d6b75f-alejomora2403-gmailcoms-projects.vercel.app).
    # Acotado a este proyecto/team, no un wildcard abierto a *.vercel.app.
    allow_origin_regex=r"^https://closer-ventas-coach-[a-z0-9-]+-alejomora2403-gmailcoms-projects\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router)
app.include_router(analisis_router)
app.include_router(dashboard_router)

@app.get("/")
def root():
    return {"status": "ok", "env": settings.APP_ENV}

@app.get("/health")
def health():
    return {"status": "healthy"}
