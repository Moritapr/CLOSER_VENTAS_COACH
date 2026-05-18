# CLOSER VENTAS COACH

Herramienta web que analiza grabaciones de ventas IUL con IA y genera feedback para mejorar como vendedor.

## Stack
- Frontend: React + Vanilla JS → Vercel
- Backend: FastAPI (Python) → Railway
- BD: Supabase (PostgreSQL)
- Transcripción: Whisper API (OpenAI)
- Análisis: Claude API (Anthropic)

## Flujo
MP3 → Whisper (transcribe) → Claude (analiza 7 fases) → Reporte + métricas en Supabase

## Setup local
Ver frontend/README.md y backend/README.md
