// Alunos
export interface Aluno {
  IDunico: string; // 12 dígitos
  IDescolar: string;
  nome: string;
  info_1: string;
  info_2: string;
  nome_mae: string;
  nome_pai: string;
  tel1: string;
  tel2: string;
  dn: string; // data: YYYY-MM-DD internamente
  ano: string; // "1º", "2º", etc
  sala: string;
  turno: string; // "manhã" ou "tarde"
  id_professora: number;
  id_auxiliar: number;
  tem_foto: boolean;
}

// Professoras e Auxiliares
export interface Professora {
  id: number;
  nome: string;
}

export interface Auxiliar {
  id: number;
  nome: string;
}

// Mensagens template
export interface Mensagem {
  texto: string;
}

// ZIP Manifest
export interface Manifest {
  versao: number;
  gerado_em: string;
  gerado_por: string;
  total_alunos: number;
  total_alunos_com_foto: number;
  total_salas: number;
  total_turmas: number;
  total_turnos: number;
  total_professoras: number;
  total_auxiliares: number;
}

// Config
export interface Config {
  versao: number;
  num_arauto: string;
  senha_inicial: string;
  atualizado_em: string;
}

// Estado de Autenticação
export interface EstadoAutenticacao {
  autenticado: boolean;
  dataValidade: string; // ISO date
  ultimaContraSenhaHoje: boolean;
  device_id: string;
}

// Cartão de conferência
export interface CartaoConferencia {
  IDunico: string;
  IDescolar: string;
  nome: string;
  estado: "padrao" | "verde" | "amarelo";
}

// Estado do app Arauto
export interface CartaoArauto {
  IDunico: string;
  IDescolar: string;
  nome: string;
  tel1: string;
  ter_foto: boolean;
  status: "pendente" | "enviado" | "erro";
}
