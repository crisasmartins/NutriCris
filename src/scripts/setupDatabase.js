import { neon } from '@neondatabase/serverless';

const DATABASE_URL = 'postgresql://neondb_owner:npg_YMqvR45TGASa@ep-noisy-glitter-aciycbht-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(DATABASE_URL);

async function setupDatabase() {
  console.log('🚀 Iniciando criação e verificação do Schema do Neon PostgreSQL...\n');

  // 1. Tabela nutricionistas
  await sql`
    CREATE TABLE IF NOT EXISTS nutricionistas (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  console.log('✅ Tabela nutricionistas criada/verificada.');

  // 2. Tabela pacientes
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
  console.log('✅ Tabela pacientes criada/verificada.');

  // 3. Tabela consultas
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
  console.log('✅ Tabela consultas criada/verificada.');

  // 4. Tabela planos_alimentares
  await sql`
    CREATE TABLE IF NOT EXISTS planos_alimentares (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
      conteudo JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  console.log('✅ Tabela planos_alimentares criada/verificada.');

  // 5. Ativação do Row Level Security (RLS)
  try {
    await sql`ALTER TABLE nutricionistas ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE consultas ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE planos_alimentares ENABLE ROW LEVEL SECURITY;`;
    console.log('🛡️ Row Level Security (RLS) ativado em todas as tabelas.\n');
  } catch (rlsErr) {
    console.warn('Alerta ao ativar RLS:', rlsErr.message);
  }

  // 6. Confirmação das Tabelas e Campos Criados
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;

  console.log('====================================================');
  console.log('📊 CONFIRMAÇÃO DAS TABELAS CRIADAS NO NEON POSTGRESQL');
  console.log('====================================================');

  for (const t of tables) {
    const cols = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = ${t.table_name}
      ORDER BY ordinal_position;
    `;
    console.log(`\n📌 Tabela: ${t.table_name.toUpperCase()}`);
    cols.forEach(c => {
      console.log(`  - ${c.column_name}: ${c.data_type}`);
    });
  }

  console.log('\n✨ Banco de dados configurado e verificado com sucesso!');
}

setupDatabase().catch(err => console.error('Erro na execução do script:', err));
