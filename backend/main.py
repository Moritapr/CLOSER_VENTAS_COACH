from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(
    title="Closer Ventas Coach API",
    description="Análisis de grabaciones de ventas IUL con IA",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "ok", "env": settings.APP_ENV}

@app.get("/health")
def health():
    return {"status": "healthy"}
