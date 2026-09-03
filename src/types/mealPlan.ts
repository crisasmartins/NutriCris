/**
 * Tipagem TypeScript para a estrutura do Plano Alimentar Manual
 */

export type RefeicaoTipo = 'cafe_manha' | 'lanche_manha' | 'almoco' | 'lanche_tarde' | 'jantar';

export type DiaSemana = 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo';

export interface RefeicoesDia {
  cafe_manha: string[];
  lanche_manha: string[];
  almoco: string[];
  lanche_tarde: string[];
  jantar: string[];
}

export interface PlanoAlimentarConteudo {
  dias: Record<DiaSemana, RefeicoesDia>;
}

export interface PlanoAlimentar {
  id: string;
  paciente_id: string;
  conteudo: PlanoAlimentarConteudo;
  created_at: string;
}

export const INITIAL_PLANO_CONTEUDO: PlanoAlimentarConteudo = {
  dias: {
    segunda: {
      cafe_manha: ['', '', '', '', ''],
      lanche_manha: ['', '', '', '', ''],
      almoco: ['', '', '', '', ''],
      lanche_tarde: ['', '', '', '', ''],
      jantar: ['', '', '', '', '']
    },
    terca: {
      cafe_manha: ['', '', '', '', ''],
      lanche_manha: ['', '', '', '', ''],
      almoco: ['', '', '', '', ''],
      lanche_tarde: ['', '', '', '', ''],
      jantar: ['', '', '', '', '']
    },
    quarta: {
      cafe_manha: ['', '', '', '', ''],
      lanche_manha: ['', '', '', '', ''],
      almoco: ['', '', '', '', ''],
      lanche_tarde: ['', '', '', '', ''],
      jantar: ['', '', '', '', '']
    },
    quinta: {
      cafe_manha: ['', '', '', '', ''],
      lanche_manha: ['', '', '', '', ''],
      almoco: ['', '', '', '', ''],
      lanche_tarde: ['', '', '', '', ''],
      jantar: ['', '', '', '', '']
    },
    sexta: {
      cafe_manha: ['', '', '', '', ''],
      lanche_manha: ['', '', '', '', ''],
      almoco: ['', '', '', '', ''],
      lanche_tarde: ['', '', '', '', ''],
      jantar: ['', '', '', '', '']
    },
    sabado: {
      cafe_manha: ['', '', '', '', ''],
      lanche_manha: ['', '', '', '', ''],
      almoco: ['', '', '', '', ''],
      lanche_tarde: ['', '', '', '', ''],
      jantar: ['', '', '', '', '']
    },
    domingo: {
      cafe_manha: ['', '', '', '', ''],
      lanche_manha: ['', '', '', '', ''],
      almoco: ['', '', '', '', ''],
      lanche_tarde: ['', '', '', '', ''],
      jantar: ['', '', '', '', '']
    }
  }
};
