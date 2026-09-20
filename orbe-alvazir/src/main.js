import { gerarTodasContraSenhas, extrairDataDaSenha, } from "@orbe/algoritmo-senha";
// ==== Utilidades ====
async function gerarContraSenhas(senha) {
    // Valida se é do dia atual
    const dataSenha = extrairDataDaSenha(senha);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataSenhaFormatada = dataSenha ? new Date(dataSenha) : null;
    if (dataSenhaFormatada) {
        dataSenhaFormatada.setHours(0, 0, 0, 0);
    }
    const avisoEl = document.getElementById("aviso-erro");
    if (!dataSenhaFormatada || dataSenhaFormatada.getTime() !== hoje.getTime()) {
        avisoEl.textContent = "⚠️ Senha não é do dia atual";
        avisoEl.classList.remove("escondido");
        document.getElementById("contrassenhas-container").style.display = "none";
        return;
    }
    avisoEl.classList.add("escondido");
    // Gera contra-senhas
    const todasContraSenhas = await gerarTodasContraSenhas(senha);
    // Exibe
    const container = document.getElementById("contrassenhas-container");
    const senhaExibida = document.getElementById("senha-exibida");
    const lista = document.getElementById("lista-contrassenhas");
    senhaExibida.value = senha;
    lista.innerHTML = "";
    const tipos = [
        { chave: "1m", texto: "1 mês", dias: 30 },
        { chave: "3m", texto: "3 meses", dias: 90 },
        { chave: "6m", texto: "6 meses", dias: 180 },
        { chave: "12m", texto: "12 meses", dias: 365 },
    ];
    let numero = 1;
    for (const tipo of tipos) {
        const contraSenha = todasContraSenhas[tipo.chave];
        const item = document.createElement("div");
        item.className = "contrassenha-item";
        item.innerHTML = `
      <div class="contrassenha-info">
        <h3>${numero}${numero === 1 ? "-" : "-"} ${tipo.texto}</h3>
        <div class="valor">${contraSenha}</div>
        <div class="prazo">Adiciona ${tipo.texto} à validade</div>
      </div>
      <button class="btn-copiar" data-valor="${contraSenha}">📝</button>
    `;
        item
            .querySelector(".btn-copiar")
            .addEventListener("click", async () => {
            await navigator.clipboard.writeText(contraSenha);
            const btn = item.querySelector(".btn-copiar");
            const original = btn.textContent;
            btn.textContent = "✅";
            setTimeout(() => {
                btn.textContent = original;
            }, 1500);
        });
        lista.appendChild(item);
        numero++;
    }
    container.style.display = "block";
}
// ==== Inicialização ====
async function inicializar() {
    // Botões
    document.getElementById("btn-colar").addEventListener("click", async () => {
        const texto = await navigator.clipboard.readText();
        document.getElementById("input-senha").value =
            texto.slice(0, 8).toUpperCase();
    });
    document
        .getElementById("btn-limpar")
        .addEventListener("click", () => {
        document.getElementById("input-senha").value = "";
        document.getElementById("contrassenhas-container").style.display =
            "none";
        document
            .getElementById("aviso-erro")
            .classList.add("escondido");
    });
    document.getElementById("btn-gerar").addEventListener("click", async () => {
        const senha = document.getElementById("input-senha")
            .value.toUpperCase();
        if (senha.length !== 8) {
            const aviso = document.getElementById("aviso-erro");
            aviso.textContent = "⚠️ Senha deve ter 8 caracteres";
            aviso.classList.remove("escondido");
            return;
        }
        await gerarContraSenhas(senha);
    });
    // Enter para gerar
    document
        .getElementById("input-senha")
        .addEventListener("keypress", async (e) => {
        if (e.key === "Enter") {
            const senha = e.target.value.toUpperCase();
            if (senha.length === 8) {
                await gerarContraSenhas(senha);
            }
        }
    });
    console.log("Orbe Alvazir inicializado");
}
document.addEventListener("DOMContentLoaded", inicializar);
