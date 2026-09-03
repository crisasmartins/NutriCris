// Script Node.js para recriar Maria Clara Silva com plano alimentar IA no Neon
import { neon } from '@neondatabase/serverless';
import { GoogleGenerativeAI } from '@google/generative-ai';

const DATABASE_URL = 'postgresql://neondb_owner:npg_YMqvR45TGASa@ep-noisy-glitter-aciycbht-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';
const GOOGLE_API_KEY = 'AIzaSyCbVzFoB3kL8yCswNRjHtNiXjMMlMHCK9k';

const sql = neon(DATABASE_URL);

async function main() {
  // 1. Verificar nutricionista
  const nutris = await sql`SELECT id, nome FROM nutricionistas LIMIT 1`;
  if (!nutris.length) throw new Error('Nenhum nutricionista encontrado no banco!');
  const nutri = nutris[0];
  console.log('Nutricionista:', nutri.nome, '|', nutri.id);

  // 2. Inserir Maria Clara Silva
  let paciente;
  const existingPaciente = await sql`SELECT id, nome FROM pacientes WHERE nome = 'Maria Clara Silva' AND nutricionista_id = ${nutri.id}`;
  if (existingPaciente.length > 0) {
    paciente = existingPaciente[0];
    console.log('Paciente já existe:', paciente.nome, '|', paciente.id);
  } else {
    const inserted = await sql`
      INSERT INTO pacientes (
        nutricionista_id, nome, data_nascimento, sexo, telefone, whatsapp, email,
        peso_inicial, altura, objetivos, objetivo_texto, nivel_atividade,
        patologias, restricoes_alimentares, alergias, medicamentos, suplementos,
        refeicoes_por_dia, horario_acorda, horario_dorme, litros_agua,
        atividade_fisica, atividade_fisica_descricao, observacoes
      ) VALUES (
        ${nutri.id},
        'Maria Clara Silva',
        '1990-05-15',
        'Feminino',
        '(11) 99876-5432',
        '(11) 99876-5432',
        'mariaclara.silva@email.com',
        72.5,
        163,
        ARRAY['Emagrecer', 'Reeducação alimentar'],
        'Deseja perder 8kg e melhorar hábitos alimentares para a rotina do trabalho.',
        'Levemente ativo',
        ARRAY['Nenhum'],
        ARRAY['Glúten'],
        ARRAY['Nenhum'],
        null,
        'Whey protein isolado 25g pós-treino',
        5,
        '06:30',
        '22:30',
        2.0,
        true,
        'Caminhada 3x por semana, 30 minutos cada.',
        'Paciente motivada. Restrição de glúten por intolerância comprovada. Prefere refeições práticas para levar ao trabalho.'
      )
      RETURNING id, nome;
    `;
    paciente = inserted[0];
    console.log('Paciente criada:', paciente.nome, '|', paciente.id);
  }

  // 3. Gerar plano alimentar via Gemini
  const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
  const dados = {
    nome: 'Maria Clara Silva',
    idade: 35,
    sexo: 'Feminino',
    peso: '72.5 kg',
    altura: '163 cm',
    imc: '27.3 (Sobrepeso leve)',
    objetivos: ['Emagrecer', 'Reeducação alimentar'],
    objetivo_texto: 'Deseja perder 8kg e melhorar hábitos alimentares para a rotina do trabalho.',
    nivel_atividade: 'Levemente ativo — Caminhada 3x por semana, 30 minutos',
    patologias: 'Nenhuma',
    restricoes_alimentares: 'Glúten (intolerância comprovada — todos os alimentos devem ser sem glúten)',
    alergias: 'Nenhuma',
    medicamentos: 'Nenhum',
    suplementos: 'Whey protein isolado 25g pós-treino',
    refeicoes_por_dia: 5,
    horario_acorda: '06:30',
    horario_dorme: '22:30',
    litros_agua: '2.0L/dia',
    observacoes: 'Prefere refeições práticas para levar ao trabalho.'
  };

  const prompt = `Você é um nutricionista clínico profissional especialista na culinária e rotina brasileira.
Gere um plano alimentar semanal completo, saudável e diversificado com base nos dados do paciente fornecidos abaixo.

Dados do Paciente (Metas, Alergias, Restrições e Histórico):
${JSON.stringify(dados, null, 2)}

# Regras Críticas de Execução:
- Você deve responder APENAS e estritamente o objeto JSON solicitado.
- Não inclua blocos de código markdown, explicações, introduções ou textos complementares.
- Adapte o cardápio rigorosamente a quaisquer alergias ou restrições descritas nos dados.
- Utilize alimentos comuns, acessíveis e culturalmente aceitos no Brasil.
- Evite repetições monótonas de alimentos nos dias seguidos.
- TODOS os alimentos devem ser sem glúten.

O formato do JSON retornado deve seguir exatamente esta estrutura com 7 dias e 5 refeições cada:
{
  "plano_semanal": [
    {
      "dia": "Segunda-feira",
      "refeicoes": {
        "cafe_da_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "almoco": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_tarde": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "jantar": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"]
      }
    }
  ]
}`;

  console.log('\nGerando plano alimentar via Gemini AI...');
  const models = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-flash-lite-latest', 'gemini-3.6-flash'];
  let planoJson = null;

  for (const modelName of models) {
    try {
      console.log(`  Tentando modelo: ${modelName}`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: 'application/json' }
      });
      const result = await model.generateContent(prompt);
      let text = result.response.text().trim();
      if (text.startsWith('```json')) text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      else if (text.startsWith('```')) text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
      planoJson = JSON.parse(text);
      console.log(`  ✅ Plano gerado com modelo: ${modelName}`);
      break;
    } catch (e) {
      console.warn(`  ⚠️ Modelo ${modelName} falhou: ${e.message}`);
    }
  }

  if (!planoJson) throw new Error('Nenhum modelo Gemini conseguiu gerar o plano.');

  // 4. Persistir plano no Neon
  await sql`
    INSERT INTO planos_alimentares (paciente_id, conteudo)
    VALUES (${paciente.id}, ${JSON.stringify(planoJson)});
  `;
  console.log('\n✅ Plano alimentar salvo no banco com sucesso!');
  console.log('Dias gerados:', planoJson.plano_semanal.map(d => d.dia).join(', '));
  console.log('\n📋 Resumo do plano — Exemplo Segunda-feira:');
  const seg = planoJson.plano_semanal[0];
  Object.entries(seg.refeicoes).forEach(([r, opcoes]) => {
    console.log(`  ${r}: ${opcoes[0]}`);
  });
}

main().then(() => {
  console.log('\n🎉 Maria Clara Silva recuperada e plano alimentar completo criado com sucesso!');
  process.exit(0);
}).catch(err => {
  console.error('\n❌ ERRO:', err.message);
  process.exit(1);
});
