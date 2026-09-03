import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Função para gerar plano alimentar estruturado usando Google Gemini AI.
 * Tenta utilizar a Serverless API backend (/api/gerar-plano) em produção por segurança,
 * ou fallback via SDK Gemini direto no cliente se executado localmente sem Vercel API.
 */
export async function gerarPlanoAlimentarComIA(dadosPaciente, apiKeyOverride = null) {
  // 1. Tentar Serverless Backend API /api/gerar-plano (Segurança absoluta de API Key)
  try {
    const apiRes = await fetch('/api/gerar-plano', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dados_do_paciente: dadosPaciente })
    });

    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data && (data.dias || data.plano_semanal)) {
        return data;
      }
    }
  } catch (backendErr) {
    console.warn('Servidor local /api/gerar-plano não disponível. Usando fallback no frontend.', backendErr);
  }

  // 2. Fallback via SDK no Cliente
  const apiKey = apiKeyOverride || 
                 import.meta.env.VITE_GEMINI_API_KEY || 
                 import.meta.env.GOOGLE_API_KEY ||
                 (typeof process !== 'undefined' ? (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) : null);
  
  if (!apiKey) {
    throw new Error('Chave de API do Gemini (VITE_GEMINI_API_KEY / GOOGLE_API_KEY) não configurada.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const promptText = `
Você é um nutricionista clínico profissional especialista na culinária e rotina brasileira.
Gere um plano alimentar semanal completo, saudável e diversificado com base nos dados do paciente fornecidos abaixo.

Dados do Paciente (Metas, Alergias, Restrições e Histórico):
${JSON.stringify(dadosPaciente, null, 2)}

# Regras Críticas de Execução:
- Você deve responder APENAS e estritamente o objeto JSON solicitado.
- Não inclua blocos de código markdown (como \`\`\`json ... \`\`\`), explicações, introduções ou textos complementares.
- Adapte o cardápio rigorosamente a quaisquer alergias ou restrições descritas nos dados.
- Utilize alimentos comuns, acessíveis e culturalmente aceitos no Brasil.
- Evite repetições monótonas de alimentos nos dias seguidos.

O formato do JSON retornado deve seguir exatamente esta estrutura:
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
}
`;

  // Modelo oficial ativo no Google Generative AI API
  const availableModels = [
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-flash-lite-latest',
    'gemini-3.6-flash'
  ];
  let responseText = null;
  let lastError = null;

  for (const modelName of availableModels) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json'
        }
      });
      const result = await model.generateContent(promptText);
      responseText = result.response.text();
      if (responseText) break;
    } catch (modelErr) {
      console.warn(`Tentativa com modelo ${modelName} falhou:`, modelErr?.message || modelErr);
      lastError = modelErr;
    }
  }

  if (!responseText) {
    throw new Error(`Falha ao gerar plano com IA: ${lastError?.message || 'Nenhum modelo Gemini respondeu.'}`);
  }

  let cleanJson = responseText.trim();
  if (cleanJson.startsWith('```json')) {
    cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanJson.startsWith('```')) {
    cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  const parsedData = JSON.parse(cleanJson);
  return parsedData;
}
