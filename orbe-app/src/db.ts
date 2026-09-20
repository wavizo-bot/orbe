import Dexie from "dexie";
import { Aluno, Professora, Auxiliar, Mensagem, Config } from "@orbe/tipos";

export class OrbeAppBD extends Dexie {
  alunos!: Dexie.Table<Aluno, string>;
  professoras!: Dexie.Table<Professora, number>;
  auxiliares!: Dexie.Table<Auxiliar, number>;
  mensagens!: Dexie.Table<Mensagem, number>;
  config!: Dexie.Table<Config, number>;
  fotos!: Dexie.Table<{ IDunico: string; dados: Blob }, string>;
  imagensInstitucionais!: Dexie.Table<
    { nome: string; dados: Blob },
    string
  >;
  autenticacao!: Dexie.Table<
    {
      id: number;
      autenticado: boolean;
      dataValidade: string;
      ultimaContraSenhaHoje: boolean;
    },
    number
  >;
  conferencia!: Dexie.Table<
    { IDunico: string; estado: "padrao" | "verde" | "amarelo" },
    string
  >;

  constructor() {
    super("orbe-app");
    this.version(1).stores({
      alunos: "IDunico, IDescolar",
      professoras: "id",
      auxiliares: "id",
      mensagens: "++",
      config: "++",
      fotos: "IDunico",
      imagensInstitucionais: "nome",
      autenticacao: "++",
      conferencia: "IDunico",
    });
  }

  async carregarDoJSON(dados: {
    alunos: Aluno[];
    professoras: Professora[];
    auxiliares: Auxiliar[];
    mensagens: Mensagem[];
    config?: Config;
  }): Promise<void> {
    await this.transaction(
      "rw",
      this.alunos,
      this.professoras,
      this.auxiliares,
      this.mensagens,
      this.config,
      async () => {
        await this.alunos.clear();
        await this.professoras.clear();
        await this.auxiliares.clear();
        await this.mensagens.clear();

        await this.alunos.bulkPut(dados.alunos);
        await this.professoras.bulkPut(dados.professoras);
        await this.auxiliares.bulkPut(dados.auxiliares);
        await this.mensagens.bulkPut(dados.mensagens);

        if (dados.config) {
          await this.config.put(dados.config);
        }

        // Inicializa conferência
        for (const aluno of dados.alunos) {
          await this.conferencia.put({
            IDunico: aluno.IDunico,
            estado: "padrao",
          });
        }
      }
    );
  }

  async buscarAlunos(termo: string): Promise<Aluno[]> {
    const todos = await this.alunos.toArray();
    const termoLower = termo.toLowerCase();
    return todos.filter(
      (a) =>
        a.nome.toLowerCase().includes(termoLower) ||
        a.IDescolar.includes(termo)
    );
  }

  async getEstadoAutenticacao() {
    const reg = await this.autenticacao.toArray();
    if (reg.length === 0) {
      return {
        autenticado: false,
        dataValidade: "",
        ultimaContraSenhaHoje: false,
      };
    }
    return reg[0];
  }

  async setEstadoAutenticacao(estado: {
    autenticado: boolean;
    dataValidade: string;
    ultimaContraSenhaHoje: boolean;
  }) {
    await this.autenticacao.clear();
    await this.autenticacao.add({
      id: 1,
      ...estado,
    });
  }
}

export const db = new OrbeAppBD();
