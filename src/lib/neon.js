import { neon } from '@neondatabase/serverless';

export const NEON_AUTH_URL = 'https://ep-calm-forest-ax2nihyb.neonauth.c-4.us-east-2.aws.neon.tech/neondb/auth';

const DATABASE_URL = 'postgresql://neondb_owner:npg_IegXuOw49nqG@ep-calm-forest-ax2nihyb-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require';

export const sql = neon(DATABASE_URL);

/**
 * Ensure tables exist in Neon PostgreSQL database according to specification
 */
export async function ensureDatabaseSchema() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS nutricionistas (
        id UUID PRIMARY KEY,
        nome TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS pacientes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nutricionista_id UUID REFERENCES nutricionistas(id) ON DELETE CASCADE,
        nome TEXT NOT NULL,
        data_nascimento DATE,
        sexo TEXT,
        telefone TEXT,
        whatsapp TEXT,
        email TEXT,
        peso_inicial NUMERIC,
        altura NUMERIC,
        objetivos TEXT[],
        objetivo_texto TEXT,
        nivel_atividade TEXT,
        patologias TEXT[],
        restricoes_alimentares TEXT[],
        alergias TEXT[],
        medicamentos TEXT,
        suplementos TEXT,
        refeicoes_por_dia INTEGER,
        horario_acorda TEXT,
        horario_dorme TEXT,
        litros_agua NUMERIC,
        atividade_fisica BOOLEAN DEFAULT FALSE,
        atividade_fisica_descricao TEXT,
        observacoes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS consultas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
        data_consulta DATE NOT NULL DEFAULT CURRENT_DATE,
        peso NUMERIC,
        cintura NUMERIC,
        quadril NUMERIC,
        percentual_gordura NUMERIC,
        observacoes TEXT,
        proximo_retorno DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS planos_alimentares (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
        conteudo JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
  } catch (err) {
    console.error('Erro ao verificar/criar tabelas no Neon DB:', err);
  }
}

/**
 * Sign up a new user with email, password, and name via Neon Auth
 * and persist them into the `nutricionistas` database table.
 */
export async function neonSignUp({ email, password, name }) {
  await ensureDatabaseSchema();

  const response = await fetch(`${NEON_AUTH_URL}/sign-up/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': window.location.origin
    },
    body: JSON.stringify({ email, password, name })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Erro ao realizar cadastro');
  }

  // Save/Upsert nutritionist in `nutricionistas` table
  if (data.user) {
    try {
      await sql`
        INSERT INTO nutricionistas (id, nome, email)
        VALUES (${data.user.id}, ${name}, ${email})
        ON CONFLICT (email) DO UPDATE SET nome = EXCLUDED.nome;
      `;
    } catch (dbErr) {
      console.warn('Alerta: Erro ao sincronizar tabela nutricionistas no Neon DB:', dbErr);
    }
  }

  return data;
}

/**
 * Sign in existing user with email and password via Neon Auth
 */
export async function neonSignIn({ email, password }) {
  const response = await fetch(`${NEON_AUTH_URL}/sign-in/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': window.location.origin
    },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Credenciais inválidas. Verifique seu e-mail e senha.');
  }

  return data;
}

/**
 * Get current session info
 */
export async function neonGetSession(token) {
  if (!token) return null;
  
  try {
    const response = await fetch(`${NEON_AUTH_URL}/get-session`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Origin': window.location.origin
      }
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (e) {
    return null;
  }
}

