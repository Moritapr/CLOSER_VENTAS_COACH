import anthropic
from app.core.config import settings

client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

PROMPT_SISTEMA = """Sos un analista de ventas que estudia grabaciones de los mejores productores (top
producers) de una comunidad de venta de seguros IUL a familias hispanas en Estados Unidos. Tu trabajo
NO es evaluar errores ni corregir nada — es extraer, con precisión quirúrgica, los patrones que hacen
que este productor venda bien, para que otros closers puedan estudiarlos y aplicarlos en sus propias
llamadas.

REGLAS:
- Extraé frases TEXTUALES del productor siempre que sea posible, nunca parafraseadas. El valor de esta
  biblioteca está en las palabras exactas que usó, no en un resumen de lo que quiso decir.
- Extraé todo lo aprovechable de la llamada, sin límite artificial de cantidad. Si hay 8 objeciones
  bien resueltas, extraé las 8 — no elijas "las mejores 3" ni resumas de más.
- Si algo no ocurrió en la llamada (el productor no enfrentó objeciones, no hubo una transición
  marcada entre fases, lo que sea), devolvé una lista vacía para esa sección. Nunca inventes ni
  completes con un ejemplo genérico solo para no dejar el campo vacío.
- El contexto siempre es venta de seguros IUL a familias hispanas en Estados Unidos — interpretá
  objeciones, precio y jerga en ese contexto (dólares, ingreso familiar, cultura, estatus migratorio,
  etc.)."""

PROMPT_EXTRACCION = """Estudiá esta llamada de un top producer de seguros IUL y extraé sus patrones.
Responde SOLO en JSON.

TRANSCRIPCIÓN:
{transcripcion}

Para cada sección de abajo, extraé todo lo que aparezca en la llamada — sin límite de cantidad, sin
resumir de más, con las frases textuales del productor siempre que sea posible:

- objeciones: cada objeción real que puso el cliente, con la respuesta textual del productor y qué
  hace efectiva esa respuesta.
- manejo_precio: cada momento donde se habló del monto o el precio — cómo lo presentó o defendió el
  productor, textual, y qué técnica usó (comparación, reencuadre, desglose mensual, etc.).
- frases_clave: frases textuales del productor que valga la pena que otro closer memorice y reuse, con
  el momento o fase donde las usó y para qué sirven.
- control_conversacion: momentos donde el cliente intentó desviar, apurar o tomar el control de la
  conversación, y cómo lo retomó el productor.
- transiciones: los puentes que usó el productor para pasar de una fase a otra del guion (por ejemplo
  de descubrimiento a la oferta, o de la oferta al cierre), con la frase textual que usó.
- cierre: cómo pidió el compromiso, cómo manejó las dudas de último momento, y cómo terminó la
  llamada.

Responde EXACTAMENTE con esta estructura JSON, sin texto adicional antes ni después:

{{
  "resumen_llamada": "<qué tipo de llamada fue, cómo terminó, contexto del cliente>",
  "objeciones": [
    {{
      "objecion": "<la objeción del cliente, textual>",
      "respuesta": "<cómo la respondió el productor, textual>",
      "por_que_funciona": "<qué hace efectiva esa respuesta>"
    }}
  ],
  "manejo_precio": [
    {{
      "situacion": "<qué pasó con el monto>",
      "respuesta": "<qué dijo el productor, textual>",
      "tecnica": "<qué técnica usó>"
    }}
  ],
  "frases_clave": [
    {{
      "momento": "<en qué fase o situación>",
      "frase": "<la frase textual del productor>",
      "proposito": "<para qué sirve esa frase>"
    }}
  ],
  "control_conversacion": [
    {{
      "situacion": "<cuándo el cliente intentó llevar la conversación>",
      "como_retomo": "<qué hizo o dijo el productor para retomar>"
    }}
  ],
  "transiciones": [
    {{
      "de_fase": "<fase de origen>",
      "a_fase": "<fase destino>",
      "frase": "<cómo hizo el puente, textual>"
    }}
  ],
  "cierre": {{
    "como_pidio_compromiso": "<textual>",
    "manejo_de_dudas_finales": "<textual>",
    "resultado": "<cerró / agendó / se perdió>"
  }}
}}"""


async def extraer_patrones(transcripcion: str) -> dict:
    respuesta = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=8000,
        system=PROMPT_SISTEMA,
        messages=[
            {
                "role": "user",
                "content": PROMPT_EXTRACCION.format(transcripcion=transcripcion)
            }
        ]
    )

    import json
    texto = respuesta.content[0].text.strip()
    if texto.startswith("```"):
        texto = texto.split("```")[1]
        if texto.startswith("json"):
            texto = texto[4:]
    texto = texto.strip()

    print(f"CLAUDE EXTRACCION RESPONSE: {repr(texto)}")

    if not texto:
        raise ValueError("Claude devolvió una respuesta vacía")

    try:
        resultado = json.loads(texto)
    except json.JSONDecodeError as e:
        print(f"JSON PARSE ERROR (extraccion): {e}")
        print(f"CONTENIDO COMPLETO:\n{texto}")
        raise ValueError(f"La respuesta de Claude no es JSON válido: {e}")

    return resultado
