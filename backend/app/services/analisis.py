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

CRITERIO PARA evaluacion_dominio — MANAGER EXIGENTE, NO AMIGO, PERO PRECISO:
- El puntaje_general ya NO lo decidís vos: se calcula automáticamente a partir de evaluacion_dominio. Por eso
  cada criterio tiene que ser preciso, no una impresión general — evaluálos con honestidad de manager exigente,
  no de amigo, pero siempre respaldado en evidencia concreta. Un manager exigente no regala una nota alta solo
  porque se tocaron los pasos del script, pero tampoco inventa errores que no puede señalar con una cita.
- Puntúa el DOMINIO de la llamada, no si se tocaron los pasos del script. Una llamada puede tener las 7 fases
  realizadas y aun así merecer criterios en ocurrio=true si el cliente dominó la conversación, si las dudas
  quedaron mal resueltas, o si el closer perdió el control ante las objeciones — siempre que puedas citar el
  momento exacto.
- cliente_domino es el error más grave de todos: el cliente se hizo sentir más fuerte que el vendedor, llevó
  el ritmo de la conversación, o el closer quedó a la defensiva. Si pasó, aunque sea en un momento puntual de
  la llamada, marcalo con ocurrio=true y citá ese momento en evidencia.
- Marcá ocurrio=true SOLO si podés citar en evidencia un fragmento textual concreto y significativo de la
  transcripción que lo demuestre. No marques un criterio como ocurrido "por si acaso" o por impresión general
  — necesitás poder señalar el momento exacto. Sin cita concreta, es false. El objetivo es precisión, no dureza
  por defecto: un error leve o dudoso que no puedas evidenciar con una cita va false.
- Evaluá evaluacion_dominio AL FINAL, después de haber escrito fases, objeciones_detectadas, mapa_friccion,
  fortalezas y areas_de_mejora. Releé lo que vos mismo ya escribiste en esas secciones antes de marcar cada
  criterio — no lo evalúes en el vacío, evalúalo contra tu propio análisis.
- Coherencia interna obligatoria, sin excepciones: si mapa_friccion tiene un momento de tipo "perdida_control",
  perdio_control_tema.ocurrio DEBE ser true (usá ese mismo fragmento como evidencia). Si mapa_friccion tiene un
  momento donde el cliente impone condiciones o el closer cede sin resistencia, cliente_domino.ocurrio DEBE ser
  true. Si areas_de_mejora menciona que una objeción quedó sin resolver, objecion_mal_resuelta.ocurrio DEBE ser
  true. No puede haber una fortaleza que contradiga un criterio en ocurrio=true, ni un criterio en ocurrio=false
  que contradiga un problema que vos mismo describiste en otra parte del análisis.
- El mismo estándar exigente aplica a los puntajes de cada fase individual (1-10): nunca pongas un 8 o 9 en
  una fase cuyo feedback describe un problema serio.
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

CRITERIOS OBSERVABLES PARA evaluacion_dominio — se evalúa AL FINAL, después de escribir el resto del análisis.
Cada criterio tiene señales concretas que indican qué tipo de momento cuenta. Pero tener una señal no alcanza:
para marcar ocurrio=true tenés que poder citar en evidencia el fragmento textual exacto de la transcripción
que lo demuestra. Si no podés citarlo, es false, sin importar la impresión general que te haya dejado la llamada:

- cliente_domino: el cliente marca el precio/monto y el closer acepta sin contrastar · el cliente cambia de
  tema y el closer lo sigue sin retomar · el cliente hace más preguntas que el closer · el closer cede ante
  una petición sin dar alternativa.
- objecion_mal_resuelta: el closer no responde la objeción puntual y cambia de tema o da una respuesta
  genérica · el cliente repite la misma duda u objeción más de una vez · el cliente nunca dice explícitamente
  que quedó conforme con la respuesta.
- genero_mas_dudas: el cliente pregunta de nuevo justo después de una explicación, señal de que no entendió
  · el closer da información contradictoria entre un momento y otro de la llamada · el cliente dice frases
  como "no entendí" o "estoy confundido".
- perdio_control_tema: ante una objeción, el closer cambia de tema en vez de resolverla · el closer se queda
  callado o da una respuesta evasiva ante una objeción · la conversación se desvía del guion y el closer no
  la retoma.
- piloto_automatico: el closer repite frases del script sin conectar con algo específico que el cliente acaba
  de decir · el closer ignora una respuesta emocional o personal del cliente y sigue con el siguiente paso
  como si no la hubiera escuchado · el closer no hace ninguna pregunta de seguimiento genuina sobre lo que el
  cliente contó.
- explico_confuso: el cliente pide que le repitan o expliquen de nuevo algo ya explicado · el closer usa
  jerga técnica o financiera sin explicarla en simple · la explicación es larga o enredada y no llega a un
  punto que el cliente pueda repetir con sus palabras.
- no_confirmo_compromiso: el closer avanza de fase sin que el cliente haya dicho un monto o un "sí" claro ·
  el cliente da una respuesta ambigua ("tal vez", "lo pienso") y el closer la trata como compromiso firme ·
  el closer no repite ni confirma en voz alta el monto o compromiso antes de cerrar ese tema.

El puntaje_general de esta llamada NO lo calculás vos: se calcula por código a partir de evaluacion_dominio.
Por eso evaluacion_dominio tiene que ser honesto y consistente con el resto de tu análisis — es la base real
de la nota, no un campo de relleno. Cada criterio con ocurrio=true necesita su evidencia citada; no dejes
evidencia en null si ocurrio es true, y no inventes una cita si ocurrio es false.

Responde EXACTAMENTE con esta estructura JSON, sin texto adicional antes ni después:

{{
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
  "consejo_principal": "<el único consejo más importante para la próxima llamada, en lenguaje directo>",
  "evaluacion_dominio": {{
    "cliente_domino": {{
      "ocurrio": <true|false — releé mapa_friccion y areas_de_mejora antes de responder, ver criterios observables arriba>,
      "evidencia": "<cita textual exacta que lo demuestra, o null si ocurrio es false>"
    }},
    "objecion_mal_resuelta": {{
      "ocurrio": <true|false, ver criterios observables arriba>,
      "evidencia": "<cita textual exacta, o null>"
    }},
    "genero_mas_dudas": {{
      "ocurrio": <true|false, ver criterios observables arriba>,
      "evidencia": "<cita textual exacta, o null>"
    }},
    "perdio_control_tema": {{
      "ocurrio": <true|false, ver criterios observables arriba>,
      "evidencia": "<cita textual exacta, o null>"
    }},
    "piloto_automatico": {{
      "ocurrio": <true|false, ver criterios observables arriba>,
      "evidencia": "<cita textual exacta, o null>"
    }},
    "explico_confuso": {{
      "ocurrio": <true|false, ver criterios observables arriba>,
      "evidencia": "<cita textual exacta, o null>"
    }},
    "no_confirmo_compromiso": {{
      "ocurrio": <true|false, ver criterios observables arriba>,
      "evidencia": "<cita textual exacta, o null>"
    }}
  }}
}}"""

PENALIZACIONES_DOMINIO = {
    "cliente_domino": 30,
    "objecion_mal_resuelta": 20,
    "genero_mas_dudas": 20,
    "perdio_control_tema": 15,
    "piloto_automatico": 10,
    "explico_confuso": 10,
    "no_confirmo_compromiso": 10,
}

PUNTAJE_PISO = 15


def _criterio_ocurrio(valor) -> bool:
    # Formato nuevo: {"ocurrio": bool, "evidencia": str|null}. Formato viejo
    # (análisis previos a este cambio): booleano suelto. Cualquier otra cosa
    # (falta la clave, None, etc.) se trata como que no ocurrió.
    if isinstance(valor, dict):
        return bool(valor.get("ocurrio"))
    if isinstance(valor, bool):
        return valor
    return False


def calcular_puntaje_general(evaluacion_dominio: dict) -> int:
    puntaje = 100
    for criterio, penalizacion in PENALIZACIONES_DOMINIO.items():
        if _criterio_ocurrio(evaluacion_dominio.get(criterio)):
            puntaje -= penalizacion
    return max(puntaje, PUNTAJE_PISO)


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
        resultado = json.loads(texto)
    except json.JSONDecodeError as e:
        print(f"JSON PARSE ERROR: {e}")
        print(f"CONTENIDO COMPLETO:\n{texto}")
        raise ValueError(f"La respuesta de Claude no es JSON válido: {e}")

    evaluacion_dominio = resultado.get("evaluacion_dominio")
    if not evaluacion_dominio or not any(clave in evaluacion_dominio for clave in PENALIZACIONES_DOMINIO):
        print("EVALUACION_DOMINIO AUSENTE: Claude no devolvió ninguna de las claves esperadas, no se puede calcular puntaje_general")
        print(f"CONTENIDO COMPLETO:\n{texto}")
        raise ValueError("Claude no devolvió evaluacion_dominio: no se puede calcular puntaje_general de forma confiable")

    # El puntaje_general se calcula acá, no lo decide Claude. Si Claude igual
    # incluyó uno en su JSON, esta asignación lo pisa.
    resultado["puntaje_general"] = calcular_puntaje_general(evaluacion_dominio)
    return resultado
