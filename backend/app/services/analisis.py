import anthropic
from app.core.config import settings

client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

PROMPT_SISTEMA = """Eres un coach de ventas IUL que acaba de escuchar la grabación de una llamada.
Hablas directamente con el closer, de tú a tú, como un mentor que vio exactamente qué pasó.

REGLAS DE TONO:
- Habla en primera persona dirigiéndote al closer: "perdiste al cliente cuando...", "en ese momento debiste decir..."
- Nunca uses lenguaje de reporte ni tercera persona: nada de "el agente", "el vendedor", "se observa que".
- Nada de jerga técnica de ventas: olvida "rapport", "ancla emocional", "compliance", "objeción de precio".
  Habla como hablaría cualquier persona: "cuando el cliente dijo que era caro, te quedaste callado en vez de..."
- Sé específico con momentos de la llamada. Si puedes citar lo que dijo el cliente y lo que respondió el closer, hazlo.
- Si el resultado es PERDIDA: dedica el feedback a identificar el momento exacto donde se perdió la venta
  y escribe qué frase concreta debió decir el closer en ese instante.
- Para cada fase que no se realizó correctamente, escribe en que_debio_decir una frase real lista para usar,
  no un consejo genérico. Ejemplo: "Oye [nombre], antes de contarte todo te mando mi licencia por WhatsApp
  para que veas con quién estás hablando, ¿cuál es tu número?".

REGLAS PARA FRICCIÓN, ENERGÍA Y TERMÓMETRO:
- Para mapa_friccion, energia_closer y termometro_cliente básate solo en lo que está en el texto: palabras
  exactas, respuestas cortas, evasivas, repeticiones, cambios de tema. No inventes tono de voz, silencios
  ni lenguaje corporal que no puedas leer en la transcripción.
- mapa_friccion no es una lista de errores genéricos: cada entrada es un momento puntual y real de la llamada
  (con su fragmento exacto) donde el cliente se incomodó, desconfió, se desinteresó o el closer perdió el
  control de la conversación — y qué debió hacer el closer justo ahí.
- energia_closer y termometro_cliente describen una evolución real a lo largo de la llamada, no relleno:
  si algo no cambió de inicio a fin, dilo así de simple en la observación."""

PROMPT_ANALISIS = """Escuchaste esta llamada de ventas IUL. Analiza cada fase y responde SOLO en JSON.

TRANSCRIPCIÓN:
{transcripcion}

Responde EXACTAMENTE con esta estructura JSON, sin texto adicional antes ni después:

{{
  "puntaje_general": <número del 1 al 10>,
  "resultado": "<CERRADA | VIDEOLLAMADA_AGENDADA | EN_PROCESO | PERDIDA>",
  "paso_a_videollamada": <true|false>,
  "fases": {{
    "fase_1_introduccion": {{
      "puntaje": <1-10>,
      "realizado": <true|false>,
      "feedback": "<qué hizo bien y qué falló, hablando directamente al closer>",
      "fragmento": "<cita textual de la llamada, o null si no aplica>",
      "que_debio_decir": "<frase concreta lista para usar, o null si la fase se hizo bien>"
    }},
    "fase_2_descubrimiento": {{
      "puntaje": <1-10>,
      "realizado": <true|false>,
      "feedback": "<preguntó por el objetivo — ahorro o protección familiar — y escuchó la respuesta?>",
      "fragmento": "<cita textual o null>",
      "que_debio_decir": "<frase concreta o null>"
    }},
    "fase_3_licencia": {{
      "puntaje": <1-10>,
      "realizado": <true|false>,
      "feedback": "<mandó su licencia por WhatsApp para que el cliente sepa con quién habla?>",
      "fragmento": "<cita textual o null>",
      "que_debio_decir": "<frase concreta o null>"
    }},
    "fase_4_calificacion": {{
      "puntaje": <1-10>,
      "realizado": <true|false>,
      "feedback": "<preguntó estado de salud, tipo de trabajo y estatus migratorio?>",
      "fragmento": "<cita textual o null>",
      "que_debio_decir": "<frase concreta o null>"
    }},
    "fase_5_oferta": {{
      "puntaje": <1-10>,
      "realizado": <true|false>,
      "feedback": "<explicó los 3 beneficios: crecer dinero con el S&P500, seguro de vida y cobertura en vida?>",
      "fragmento": "<cita textual o null>",
      "que_debio_decir": "<frase concreta o null>"
    }},
    "fase_6_finanzas": {{
      "puntaje": <1-10>,
      "realizado": <true|false>,
      "feedback": "<encontró un monto cómodo entre el 5 y 10 porciento del ingreso mensual del cliente?>",
      "fragmento": "<cita textual o null>",
      "que_debio_decir": "<frase concreta o null>"
    }},
    "fase_7_cierre": {{
      "puntaje": <1-10>,
      "realizado": <true|false>,
      "feedback": "<obtuvo el número de seguro social, confirmó el monto y dio los datos de la póliza?>",
      "fragmento": "<cita textual o null>",
      "que_debio_decir": "<frase concreta o null>"
    }}
  }},
  "objeciones_detectadas": [
    {{
      "objecion": "<lo que dijo el cliente textualmente o en resumen>",
      "respuesta_del_closer": "<cómo respondió el closer>",
      "que_debio_decir": "<respuesta concreta que debió dar>"
    }}
  ],
  "mapa_friccion": [
    {{
      "fragmento": "<cita textual exacta del momento de fricción>",
      "tipo": "<incomodidad | desconfianza | desinteres | perdida_control>",
      "explicacion": "<qué pasó en ese momento, en lenguaje de coach directo>",
      "que_hacer": "<qué debió hacer el closer justo en ese momento>"
    }}
  ],
  "energia_closer": {{
    "inicio": "<alta | media | baja>",
    "medio": "<alta | media | baja>",
    "final": "<alta | media | baja>",
    "observacion": "<cómo evolucionó la energía del closer durante la llamada>"
  }},
  "termometro_cliente": {{
    "inicio": "<interesado | neutral | frio | hostil>",
    "medio": "<interesado | neutral | frio | hostil>",
    "final": "<interesado | neutral | frio | hostil>",
    "observacion": "<cómo evolucionó el interés del cliente durante la llamada>"
  }},
  "fortalezas": ["<cosa específica que hizo bien>"],
  "areas_de_mejora": ["<cosa específica que falló, con ejemplo de la llamada>"],
  "consejo_principal": "<el único consejo más importante para la próxima llamada, en lenguaje directo>"
}}"""


async def analizar_llamada(transcripcion: str) -> dict:
    respuesta = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=8000,
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
    if texto.startswith("```"):
        texto = texto.split("```")[1]
        if texto.startswith("json"):
            texto = texto[4:]
    texto = texto.strip()

    print(f"CLAUDE RESPONSE: {repr(texto)}")

    if not texto:
        raise ValueError("Claude devolvió una respuesta vacía")

    try:
        return json.loads(texto)
    except json.JSONDecodeError as e:
        print(f"JSON PARSE ERROR: {e}")
        print(f"CONTENIDO COMPLETO:\n{texto}")
        raise ValueError(f"La respuesta de Claude no es JSON válido: {e}")
