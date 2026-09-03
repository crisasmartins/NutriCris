// Script para inserir plano alimentar completo de Maria Clara Silva diretamente no banco
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = 'postgresql://neondb_owner:npg_YMqvR45TGASa@ep-noisy-glitter-aciycbht-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(DATABASE_URL);

const planoCompleto = {
  plano_semanal: [
    {
      dia: "Segunda-feira",
      refeicoes: {
        cafe_da_manha: [
          "Vitamina de banana com leite de amêndoas (200ml) e whey protein isolado 25g",
          "2 ovos mexidos com azeite e cebolinha",
          "1 fatia de pão de queijo de polvilho (sem glúten)",
          "1 xícara de café com leite de coco sem açúcar",
          "5 amêndoas ou castanhas-do-pará"
        ],
        lanche_manha: [
          "1 maçã média",
          "1 iogurte natural desnatado (sem glúten, verificar rótulo)",
          "1 colher de sopa de pasta de amendoim integral sem açúcar",
          "10 uvas verdes",
          "1 tapioca pequena com queijo minas frescal"
        ],
        almoco: [
          "120g de frango grelhado temperado com ervas e limão",
          "4 colheres de sopa de arroz branco ou arroz integral",
          "3 colheres de sopa de feijão carioca cozido temperado",
          "Salada verde: alface, rúcula, tomate cereja e pepino com azeite e vinagre",
          "1 colher de sopa de azeite extravirgem"
        ],
        lanche_tarde: [
          "1 banana média com canela",
          "1 tapioca de chia com cottage",
          "1 copo de água de coco natural (200ml)",
          "Mix de frutas: mamão + abacaxi picados",
          "2 biscoitos de arroz integrais sem glúten"
        ],
        jantar: [
          "150g de peixe (tilápia ou salmão) grelhado com alho e limão",
          "3 colheres de sopa de purê de batata-doce com azeite",
          "Legumes refogados: abobrinha, cenoura e brócolis no azeite",
          "Salada de folhas verdes com tomate e pepino",
          "1 copo de chá de camomila sem açúcar"
        ]
      }
    },
    {
      dia: "Terça-feira",
      refeicoes: {
        cafe_da_manha: [
          "Mingau de aveia sem glúten com banana e mel (1 colher de chá)",
          "2 ovos cozidos",
          "1 fatia de mamão formosa",
          "1 xícara de chá verde sem açúcar",
          "Whey protein isolado 25g diluído em água ou leite de amêndoas"
        ],
        lanche_manha: [
          "1 pera média",
          "30g de queijo branco tipo minas",
          "1 punhado de mix de nuts (castanha, amêndoa, nozes)",
          "1 tapioca pequena com geleia de frutas vermelhas sem açúcar",
          "1 copo de água com limão e gengibre"
        ],
        almoco: [
          "120g de carne bovina magra (patinho) grelhada",
          "4 colheres de sopa de macarrão de arroz ou mandioca",
          "Mandioca cozida (1 pedaço pequeno — 80g)",
          "Salada de beterraba ralada com cenoura, azeite e limão",
          "Feijão preto (3 colheres de sopa) com couve refogada"
        ],
        lanche_tarde: [
          "1 laranja média",
          "1 barrinha de cereal sem glúten (ex: banana com aveia sem glúten)",
          "1 iogurte grego natural (verificar rótulo sem glúten)",
          "Palito de cenoura e pepino com homus caseiro",
          "1 copo de suco de acerola natural sem açúcar"
        ],
        jantar: [
          "2 ovos mexidos com tomate e manjericão",
          "1 filé de frango pequeno (80g) desfiado com azeite e alho",
          "3 colheres de sopa de arroz integral",
          "Salada de folhas com beterraba e azeite",
          "1 fatia de melão ou melancia"
        ]
      }
    },
    {
      dia: "Quarta-feira",
      refeicoes: {
        cafe_da_manha: [
          "Smoothie verde: espinafre + banana + leite de coco + whey protein 25g",
          "2 panquecas de banana com aveia sem glúten (1 banana + 1 ovo)",
          "1 colher de chá de mel puro",
          "1 xícara de café preto ou com leite vegetal",
          "5 nozes ou castanhas"
        ],
        lanche_manha: [
          "1 maçã com pasta de amendoim integral (1 colher de sopa)",
          "1 iogurte natural com frutas vermelhas frescas",
          "Mix de frutas: kiwi + morango",
          "1 tapioca com frango desfiado e requeijão sem glúten",
          "1 copo de água de coco"
        ],
        almoco: [
          "150g de atum em água drenado com alho e azeite",
          "4 colheres de sopa de arroz branco temperado",
          "3 colheres de sopa de lentilha cozida",
          "Legumes assados: abóbora, cebola roxa e pimentão",
          "Salada de rúcula com parmesão e azeite"
        ],
        lanche_tarde: [
          "1 banana prata",
          "2 biscoitos de polvilho assados",
          "1 copo de vitamina de abacate com cacau em pó sem açúcar",
          "Palito de aipo com pasta de gergelim (tahine)",
          "1 pêssego ou nectarina"
        ],
        jantar: [
          "120g de frango assado com ervas provençais e limão",
          "3 colheres de sopa de purê de aipim (mandioca)",
          "Brócolis e cenoura no vapor com azeite",
          "Salada de pepino, tomate e cebola roxa",
          "1 xícara de chá de erva-cidreira sem açúcar"
        ]
      }
    },
    {
      dia: "Quinta-feira",
      refeicoes: {
        cafe_da_manha: [
          "2 ovos mexidos com espinafre e tomate cereja",
          "1 tapioca média com queijo minas e tomate",
          "1 banana nanica",
          "1 xícara de café com leite de arroz sem açúcar",
          "Whey protein isolado 25g em água"
        ],
        lanche_manha: [
          "1 laranja ou tangerina",
          "1 punhado de amêndoas tostadas (20g)",
          "1 iogurte natural com granola sem glúten",
          "1 copo de suco de abacaxi com hortelã natural",
          "1 fatia fina de queijo prato"
        ],
        almoco: [
          "150g de carne moída magra temperada com alho e cebola",
          "4 colheres de sopa de arroz integral",
          "3 colheres de sopa de feijão rosinha",
          "Couve refogada com alho (4 colheres de sopa)",
          "Salada de alface americana com cenoura ralada e azeite"
        ],
        lanche_tarde: [
          "1 fatia de bolo de cenoura sem glúten caseiro",
          "1 copo de leite de amêndoas morno com canela",
          "Frutas secas: 3 ameixas + 5 damascos",
          "1 tapioca pequena com geleia de morango sem açúcar",
          "1 maçã ou pera"
        ],
        jantar: [
          "2 ovos cozidos ou pochê com azeite",
          "120g de salmão grelhado com limão e ervas",
          "3 colheres de sopa de batata-doce cozida amassada",
          "Aspargos ou ervilha-torta salteados no azeite",
          "Salada verde simples com vinagrete"
        ]
      }
    },
    {
      dia: "Sexta-feira",
      refeicoes: {
        cafe_da_manha: [
          "Vitamina de morango com leite de coco e whey protein 25g",
          "2 ovos mexidos com cúrcuma e pimenta do reino",
          "1 fatia de bolo de banana sem glúten (polvilho + banana)",
          "1 xícara de café preto",
          "Mix de frutas vermelhas: morango + framboesa"
        ],
        lanche_manha: [
          "1 pote de iogurte natural com mel e chia",
          "1 punhado de castanhas-do-pará (4 unidades)",
          "1 fatia de mamão papaia com limão",
          "2 biscoitos de arroz com pasta de amendoim",
          "1 copo de água com limão e menta"
        ],
        almoco: [
          "150g de frango assado na ervas finas com alho e limão",
          "4 colheres de sopa de arroz branco",
          "Farofa de mandioca torrada (2 colheres de sopa)",
          "Salada tropical: alface + manga + cenoura ralada + azeite",
          "Feijão preto (3 colheres) com coentro"
        ],
        lanche_tarde: [
          "1 banana com canela e mel (aquecida)",
          "1 tapioca com coco ralado e mel",
          "1 copo de suco de melancia natural sem açúcar",
          "Frutas: 1 quivi + algumas uvas",
          "1 porção de chips de batata-doce assada"
        ],
        jantar: [
          "Omelete de 3 ovos com queijo, tomate e manjericão",
          "2 fatias de pão de queijo de polvilho pequenos",
          "Salada caprese: tomate + mussarela de búfala + manjericão + azeite",
          "Sopa leve de legumes (abóbora + cenoura + batata)",
          "1 xícara de chá de hortelã sem açúcar"
        ]
      }
    },
    {
      dia: "Sábado",
      refeicoes: {
        cafe_da_manha: [
          "Tapioca grande recheada com ovos mexidos, queijo e tomate",
          "1 copo de vitamina de mamão com aveia sem glúten",
          "Frutas da estação fatiadas: abacaxi + melão",
          "1 xícara de café com leite de coco",
          "Whey protein 25g em água ou vitamina"
        ],
        lanche_manha: [
          "Açaí na tigela sem granola (ou com granola sem glúten) + banana",
          "1 pote de iogurte grego natural",
          "Mix de frutas tropicais: manga + mamão + kiwi",
          "1 fatia de bolo de laranja sem glúten caseiro",
          "1 copo de suco detox: pepino + gengibre + limão + água de coco"
        ],
        almoco: [
          "200g de carne bovina grelhada (filé mignon ou picanha sem molhos industrializados)",
          "Arroz branco (4 colheres) com farofa de mandioca",
          "Salada de feijão fradinho com tomate, cebola e coentro",
          "Legumes grelhados: abobrinha, berinjela e pimentão",
          "1 rodela de abacaxi grelhado na canela (sobremesa leve)"
        ],
        lanche_tarde: [
          "1 iogurte natural com frutas vermelhas e granola sem glúten",
          "Palito de frutas: melancia + melão + abacaxi",
          "Pipoca caseira temperada com azeite e sal (porção pequena)",
          "1 copo de limonada com menta e adoçante natural",
          "1 punhado de mix de nuts"
        ],
        jantar: [
          "150g de peixe assado (tilápia ou merluza) com ervas e limão",
          "3 colheres de sopa de purê de batata-doce com azeite",
          "Legumes no vapor: brócolis + cenoura + vagem",
          "Salada verde com molho de maracujá e azeite",
          "1 xícara de chá de camomila com mel"
        ]
      }
    },
    {
      dia: "Domingo",
      refeicoes: {
        cafe_da_manha: [
          "Panquecas de banana e ovo (sem glúten): 2 bananas + 3 ovos + canela",
          "1 iogurte natural com mel e frutas vermelhas",
          "1 copo de suco de laranja natural recém-espremido",
          "Whey protein 25g em vitamina de frutas",
          "5 amêndoas e 3 castanhas-do-pará"
        ],
        lanche_manha: [
          "1 fatia de bolo de cenoura com calda de chocolate 70% cacau (sem glúten)",
          "1 xícara de café com leite vegetal",
          "Mix de frutas: uva + morango + kiwi",
          "1 iogurte de coco natural",
          "2 biscoitos de polvilho assados"
        ],
        almoco: [
          "Frango assado ao forno com batata-doce e alho: 200g de frango",
          "Arroz integral (4 colheres) com ervilha",
          "Feijão tropeiro sem farinha (feijão, bacon, ovo, couve)",
          "Salada de rúcula com manga e vinagrete de maracujá",
          "Sobremesa: mousse de maracujá sem glúten com adoçante natural"
        ],
        lanche_tarde: [
          "Gelatina de frutas sem açúcar com pedaços de fruta",
          "1 fatia de abacaxi natural com hortelã",
          "1 iogurte natural com granola sem glúten e mel",
          "Chips de banana assada com canela",
          "1 copo de água de coco com limão"
        ],
        jantar: [
          "Sopa cremosa de abóbora com cúrcuma e gengibre",
          "2 ovos mexidos ou estrelados com azeite",
          "1 tapioca de frango desfiado com requeijão",
          "Salada de alface com tomate cereja e molho de iogurte com ervas",
          "1 xícara de chá de cidreira ou erva-doce sem açúcar"
        ]
      }
    }
  ]
};

async function main() {
  const paciente = await sql`SELECT id, nome FROM pacientes WHERE nome = 'Maria Clara Silva' LIMIT 1`;
  if (!paciente.length) throw new Error('Paciente Maria Clara Silva não encontrada no banco!');
  
  console.log('Paciente encontrada:', paciente[0].nome, '|', paciente[0].id);
  console.log('Inserindo plano alimentar completo (7 dias x 5 refeições)...');

  await sql`
    INSERT INTO planos_alimentares (paciente_id, conteudo)
    VALUES (${paciente[0].id}, ${JSON.stringify(planoCompleto)});
  `;
  
  console.log('✅ Plano alimentar inserido com sucesso!');
  console.log('Dias:', planoCompleto.plano_semanal.map(d => d.dia).join(', '));
}

main().then(() => {
  console.log('\n🎉 Maria Clara Silva e seu plano alimentar completo foram recuperados com sucesso!');
  process.exit(0);
}).catch(err => {
  console.error('❌ ERRO:', err.message);
  process.exit(1);
});
