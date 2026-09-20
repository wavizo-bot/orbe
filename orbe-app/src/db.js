import Dexie from "dexie";
export class OrbeAppBD extends Dexie {
    constructor() {
        super("orbe-app");
        Object.defineProperty(this, "alunos", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "professoras", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "auxiliares", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "mensagens", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "fotos", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "imagensInstitucionais", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "autenticacao", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "conferencia", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
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
    async carregarDoJSON(dados) {
        await this.transaction("rw", this.alunos, this.professoras, this.auxiliares, this.mensagens, this.config, async () => {
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
        });
    }
    async buscarAlunos(termo) {
        const todos = await this.alunos.toArray();
        const termoLower = termo.toLowerCase();
        return todos.filter((a) => a.nome.toLowerCase().includes(termoLower) ||
            a.IDescolar.includes(termo));
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
    async setEstadoAutenticacao(estado) {
        await this.autenticacao.clear();
        await this.autenticacao.add({
            id: 1,
            ...estado,
        });
    }
}
export const db = new OrbeAppBD();
