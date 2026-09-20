import Dexie from "dexie";
import { decompress } from "fflate";
// ==== Database simples ====
class ArautoDb extends Dexie {
    constructor() {
        super("orbe-arauto");
        Object.defineProperty(this, "alunos", {
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
        this.version(1).stores({
            alunos: "IDunico",
            mensagens: "++",
        });
    }
}
const db = new ArautoDb();
// ==== Estado ====
let alunos = new Map();
let cartoesCriados = new Map();
// ==== Utilidades ====
function mostrarBanner(msg, tipo = "sucesso") {
    const banner = document.getElementById("banner");
    banner.textContent = msg;
    banner.className = `banner ${tipo === "erro" ? "erro" : ""}`;
    banner.classList.remove("escondido");
    setTimeout(() => banner.classList.add("escondido"), 2000);
}
function abrirModal(titulo, aluno, onEnviar) {
    const modal = document.getElementById("modal-mensagem");
    const tituloEl = document.getElementById("modal-titulo");
    const textarea = document.getElementById("modal-mensagem");
    const btnEnviar = document.getElementById("modal-enviar");
    const btnCancelar = document.getElementById("modal-cancelar");
    tituloEl.textContent = titulo;
    textarea.value = "";
    btnEnviar.onclick = () => {
        onEnviar(textarea.value);
        modal.classList.add("escondido");
    };
    btnCancelar.onclick = () => {
        modal.classList.add("escondido");
    };
    modal.classList.remove("escondido");
}
async function importarZIP(arquivo) {
    try {
        const buffer = await arquivo.arrayBuffer();
        const dados = await new Promise((resolve, reject) => {
            decompress(new Uint8Array(buffer), (err, data) => {
                if (err)
                    reject(err);
                else
                    resolve(data);
            });
        });
        const alunosData = JSON.parse(new TextDecoder().decode(dados["alunos.json"])).alunos;
        // Carrega em memória
        alunos.clear();
        for (const aluno of alunosData) {
            alunos.set(aluno.IDunico, aluno);
        }
        mostrarBanner("ZIP importado");
    }
    catch (e) {
        mostrarBanner(`Erro: ${String(e)}`, "erro");
    }
}
function renderizarCartoes(listaIDunico) {
    const container = document.getElementById("cartoes-container");
    container.innerHTML = "";
    cartoesCriados.clear();
    for (const IDunico of listaIDunico) {
        const aluno = alunos.get(IDunico);
        if (!aluno)
            continue;
        const cartao = document.createElement("div");
        cartao.className = "cartao-arauto vermelho";
        cartao.id = `cartao-${IDunico}`;
        cartoesCriados.set(IDunico, cartao);
        if (aluno.tel1) {
            cartao.innerHTML = `
        <div class="cartao-body">
          <p style="flex: 1; font-weight: 500;">${aluno.tel1}</p>
          <button data-aluno="${IDunico}" class="btn-copiar">📝</button>
          <button data-aluno="${IDunico}" class="btn-enviar">📲</button>
        </div>
      `;
            cartao
                .querySelector(".btn-copiar")
                .addEventListener("click", async () => {
                await navigator.clipboard.writeText(aluno.tel1);
                mostrarBanner("Copiado");
            });
            cartao.querySelector(".btn-enviar").addEventListener("click", () => {
                abrirModal(`Enviar para ${aluno.nome}`, aluno, (msg) => {
                    const url = `https://wa.me/55${aluno.tel1}?text=${encodeURIComponent(msg)}`;
                    window.open(url, "_blank");
                    cartao.className = "cartao-arauto azul";
                    cartao.querySelector(".btn-copiar").style.display = "none";
                    cartao.querySelector(".btn-enviar").style.display = "none";
                });
            });
        }
        else {
            cartao.className = "cartao-arauto";
            cartao.innerHTML = `
        <div class="cartao-sem-telefone">
          <h3>${aluno.nome}</h3>
          <p>${IDunico}</p>
          <p class="aviso">Aluno sem nº de telefone</p>
        </div>
      `;
        }
        container.appendChild(cartao);
    }
}
async function procesarCodigo(codigo) {
    if (!codigo.trim()) {
        mostrarBanner("Digite um código válido", "erro");
        return;
    }
    const IDunicos = codigo.split("|").map((s) => s.trim());
    renderizarCartoes(IDunicos);
    mostrarBanner(`${IDunicos.length} cartões criados`);
}
// ==== Inicialização ====
async function inicializar() {
    await db.open();
    // Botões
    document.getElementById("btn-colar").addEventListener("click", async () => {
        const texto = await navigator.clipboard.readText();
        document.getElementById("input-codigo").value = texto;
    });
    document
        .getElementById("btn-limpar")
        .addEventListener("click", () => {
        document.getElementById("input-codigo").value = "";
    });
    document
        .getElementById("btn-processar")
        .addEventListener("click", async () => {
        const codigo = document.getElementById("input-codigo")
            .value;
        await procesarCodigo(codigo);
    });
    document
        .getElementById("btn-recarregar")
        .addEventListener("click", () => {
        document.getElementById("cartoes-container").innerHTML = "";
        document.getElementById("input-codigo").value = "";
        mostrarBanner("Cartões limpos");
    });
    // Importar ZIP
    document
        .getElementById("btn-processar")
        .addEventListener("contextmenu", (e) => {
        e.preventDefault();
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".zip";
        input.addEventListener("change", (ev) => {
            const file = ev.target.files?.[0];
            if (file)
                importarZIP(file);
        });
        input.click();
    });
    console.log("Orbe Arauto inicializado");
}
document.addEventListener("DOMContentLoaded", inicializar);
