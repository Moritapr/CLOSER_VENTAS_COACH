-- Tabla principal de análisis
CREATE TABLE IF NOT EXISTS analisis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    nombre_archivo TEXT,
    duracion_segundos FLOAT,
    transcripcion TEXT NOT NULL,
    puntaje_general INTEGER,
    resultado TEXT CHECK (resultado IN ('CERRADA', 'NO_CERRADA', 'EN_PROCESO')),
    fase_1_puntaje INTEGER, fase_1_realizado BOOLEAN, fase_1_feedback TEXT,
    fase_2_puntaje INTEGER, fase_2_realizado BOOLEAN, fase_2_feedback TEXT,
    fase_3_puntaje INTEGER, fase_3_realizado BOOLEAN, fase_3_feedback TEXT,
    fase_4_puntaje INTEGER, fase_4_realizado BOOLEAN, fase_4_feedback TEXT,
    fase_5_puntaje INTEGER, fase_5_realizado BOOLEAN, fase_5_feedback TEXT,
    fase_6_puntaje INTEGER, fase_6_realizado BOOLEAN, fase_6_feedback TEXT,
    fase_7_puntaje INTEGER, fase_7_realizado BOOLEAN, fase_7_feedback TEXT,
    fortalezas JSONB,
    areas_de_mejora JSONB,
    consejo_principal TEXT,
    analisis_completo JSONB
);

-- Políticas RLS para la anon key
CREATE POLICY "Allow anon insert" ON analisis FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon select" ON analisis FOR SELECT TO anon USING (true);
