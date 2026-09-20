import Dexie from "dexie";
import { Aluno, Professora, Auxiliar, Mensagem, Config } from "@orbe/tipos";

export class OrbeBancoDados extends Dexie {
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

  constructor() {
    super("orbe-escriba");
    this.version(1).stores({
      alunos: "IDunico, IDescolar",
      professoras: "id",
      auxiliares: "id",
      mensagens: "++",
      config: "++",
      fotos: "IDunico",
      imagensInstitucionais: "nome",
    });
  }

  async limparTudo(): Promise<void> {
    await this.alunos.clear();
    await this.professoras.clear();
    await this.auxiliares.clear();
    await this.mensagens.clear();
    await this.config.clear();
    await this.fotos.clear();
    await this.imagensInstitucionais.clear();
  }

  async exportarParaJSON() {
    const [alunos, professoras, auxiliares, mensagens, config] =
      await Promise.all([
        this.alunos.toArray(),
        this.professoras.toArray(),
        this.auxiliares.toArray(),
        this.mensagens.toArray(),
        this.config.toArray(),
      ]);

    return {
      alunos,
      professoras,
      auxiliares,
      mensagens,
      config: config[0] || null,
    };
  }

  async carregarDoJSON(dados: {
    alunos: Aluno[];
    professoras: Professora[];
    auxiliares: Auxiliar[];
    mensagens: Mensagem[];
    config?: Config;
  }): Promise<void> {
    await this.transaction("rw", this.alunos, this.professoras, this.auxiliares, this.mensagens, this.config, async () => {
      await this.alunos.bulkPut(dados.alunos);
      await this.professoras.bulkPut(dados.professoras);
      await this.auxiliares.bulkPut(dados.auxiliares);
      await this.mensagens.bulkPut(dados.mensagens);
      if (dados.config) {
        await this.config.put(dados.config);
      }
    });
  }
}

export const db = new OrbeBancoDados();
