import anthropic
from app.core.config import settings

client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

PROMPT_SISTEMA = """Eres un coach experto en ventas de seguros de vida IUL (Indexed Universal Life).
Analiza la transcripción de una llamada de ventas y evalúa el desempeño del agente
en cada una de las 7 fases del script IUL. Sé específico, directo y constructivo."""

PROMPT_ANALISIS = """Analiza esta transcripción de una llamada de ventas IUL y evalúa cada fase.

TRANSCRIPCIÓN:
{transcripcion}

Evalúa EXACTAMENTE estas 7 fases y responde SOLO en JSON con esta estructura:

{{
  "puntaje_general": <número del 1 al 10>,
  "resultado": "<CERRADA | NO_CERRADA | EN_PROCESO>",
  "fases": {{
    "fase_1_introduccion": {{
      "puntaje": <1-10>,
      "realizado": <true|false>,
      "feedback": "<qué hizo bien y qué mejorar>",
      "fragmento": "<cita textual de la llamada si aplica>"
    }},
    "fase_2_descubrimiento": {{
      "puntaje": <1-10>,
      "realizado": <true|false>,
      "feedback": "<identificó ahorro vs protección familiar?>",
      "fragmento": "<cita textual>"
    }},
    "fase_3_licencia": {{
      "puntaje": <1-10>,
      "realizado": <true|false>,
      "feedback": "<envió licencia por WhatsApp para generar confianza?>",
      "fragmento": "<cita textual>"
    }},
    "fase_4_calificacion": {{
      "puntaje": <1-10>,
      "realizado": <true|false>,
      "feedback": "<preguntó estado de salud, trabajo y estatus migratorio?>",
      "fragmento": "<cita textual>"
    }},
    "fase_5_oferta": {{
      "puntaje": <1-10>,
      "realizado": <true|false>,
      "feedback": "<explicó los 3 beneficios: ahorro S&P500, seguro de vida, cobertura en vida?>",
      "fragmento": "<cita textual>"
    }},
    "fase_6_finanzas": {{
      "puntaje": <1-10>,
      "realizado": <true|false>,
      "feedback": "<encontró monto cómodo entre 5-10% del ingreso mensual?>",
      "fragmento": "<cita textual>"
    }},
    "fase_7_cierre": {{
      "puntaje": <1-10>,
      "realizado": <true|false>,
      "feedback": "<obtuvo social, confirmó monto, dio datos de póliza y cerró?>",
      "fragmento": "<cita textual>"
    }}
  }},
  "fortalezas": ["<fortaleza 1>", "<fortaleza 2>"],
  "areas_de_mejora": ["<área 1>", "<área 2>"],
  "consejo_principal": "<el consejo más importante para el próximo cierre>"
}}

Responde SOLO el JSON, sin texto adicional."""


async def analizar_llamada(transcripcion: str) -> dict:
    respuesta = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2000,
        system=PROMPT_SISTEMA,
        messages=[
            {
                "role": "user",
                "content": PROMPT_ANALISIS.format(transcripcion=transcripcion)
            }
        ]
    )

    import json, re
    texto = respuesta.content[0].text.strip()
    match = re.search(r'```(?:json)?\s*([\s\S]*?)```', texto)
    if match:
        texto = match.group(1).strip()
    return json.loads(texto)
