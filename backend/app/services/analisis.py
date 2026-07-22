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

CRITERIO DE PUNTUACIÓN — MANAGER EXIGENTE, NO AMIGO:
- Eres un manager de ventas que revisa a su equipo con estándar alto. No regalas notas. Un 70 se gana.
  La mayoría de las llamadas promedio están entre 45 y 65. Solo las llamadas verdaderamente buenas pasan de 75.
  Prefiere ser duro y justo antes que amable e inútil — tu trabajo es que el closer mejore, no que se sienta bien.
- Puntúas el DOMINIO de la llamada, no si se tocaron los pasos del script. Una llamada puede tener las 7 fases
  realizadas y aun así merecer 40 o 50 si el cliente dominó la conversación, si las dudas quedaron mal resueltas,
  o si el closer perdió el control ante las objeciones. Puntúa el dominio y el resultado, no el cumplimiento de pasos.
- Errores graves que hunden el puntaje aunque el script se haya "cumplido": (a) el cliente domina la conversación
  o se hace sentir más fuerte que el vendedor, (b) el closer no responde bien las preguntas del cliente y le genera
  MÁS dudas en vez de aclararlas, (c) el closer pierde el control del tema cuando el cliente pone objeciones.
  Dale peso especial a estas señales — si aparecen, el puntaje_general no puede ser alto.
- Coherencia número-texto obligatoria: el número debe reflejar lo que describe tu análisis. Si en el texto señalas
  que el closer perdió el control, no resolvió bien una objeción clave, o el cliente llevó el ritmo, entonces el
  puntaje no puede ser alto. Nunca pongas un puntaje de 8 o 9 a una fase donde describes un problema serio. El
  mismo estándar exigente aplica a los puntajes de cada fase individual, no solo al puntaje_general.
- No penalices ni menciones como área de mejora que el closer no haya pedido el número de seguro social durante
  la llamada. El SSN se pide después, al llenar la aplicación — no es parte de esta llamada bajo ningún concepto.

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

RÚBRICA OBLIGATORIA PARA puntaje_general (0-100). NO es el promedio de las fases — es un juicio holístico
del dominio de la llamada y el resultado, no del cumplimiento de pasos:
- 90-100: cerró o quedó a punto de cerrar, dominio total de la llamada, resolvió todas las dudas del cliente con claridad.
- 70-89: llamada sólida, el closer controló la conversación y resolvió lo importante, pero se le escaparon detalles.
- 50-69: mediocre — tocó los pasos pero perdió el control en momentos clave o dejó dudas importantes sin resolver bien.
- 30-49: floja — el cliente dominó la conversación, las objeciones quedaron mal resueltas, el closer generó más dudas que claridad.
- 0-29: llamada perdida desde temprano, sin estructura ni control.

Responde EXACTAMENTE con esta estructura JSON, sin texto adicional antes ni después:

{{
  "puntaje_general": <número del 0 al 100, siguiendo estrictamente la rúbrica de arriba>,
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
      "feedback": "<confirmó el monto y dio los datos de la póliza para avanzar? (el número de seguro social se pide después, al llenar la aplicación — no es parte de esta llamada, no lo menciones como falla)>",
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
