import { db } from "./db";
import { importarDeTexto, importarDePlanilha, exportarParaZIP, importarDeZIP, importarDoSeedJSON, } from "./import-export";
import { VERSAO_ORBE } from "@orbe/constantes";
// ==== Estado Global ====
let telaAtual = "menu-principal";
let senhaExportacao = "";
let numAdministrativo = "";
// ==== Utilidades ====
function mostrarBanner(mensagem, tipo = "sucesso") {
    const banner = document.getElementById("banner");
    banner.textContent = mensagem;
    banner.className = `banner ${tipo === "sucesso" ? "" : tipo}`;
    banner.classList.remove("escondido");
    setTimeout(() => {
        banner.classList.add("escondido");
    }, 2000);
}
function abrirModal(titulo, corpo, onConfirmar = () => { }, textoConfirmar = "Confirmar", textoConcelar = "Cancelar") {
    const modal = document.getElementById("modal");
    const modalTitulo = document.getElementById("modal-titulo");
    const modalCorpo = document.getElementById("modal-corpo");
    const btnConfirmar = document.getElementById("modal-confirmar");
    const btnCancelar = document.getElementById("modal-cancelar");
    modalTitulo.textContent = titulo;
    if (typeof corpo === "string") {
        modalCorpo.innerHTML = corpo;
    }
    else {
        modalCorpo.innerHTML = "";
        modalCorpo.appendChild(corpo);
    }
    btnConfirmar.textContent = textoConfirmar;
    btnCancelar.textContent = textoConcelar;
    btnConfirmar.onclick = () => {
        onConfirmar();
        modal.classList.add("escondido");
    };
    btnCancelar.onclick = () => {
        modal.classList.add("escondido");
    };
    modal.classList.remove("escondido");
}
async function atualizarEstatisticas() {
    const alunos = await db.alunos.toArray();
    const professoras = await db.professoras.toArray();
    const auxiliares = await db.auxiliares.toArray();
    const fotos = await db.fotos.toArray();
    const salas = new Set(alunos.map((a) => a.sala));
    const turmas = new Set(alunos.map((a) => `${a.ano}-${a.sala}`));
    const turnos = new Set(alunos.map((a) => a.turno));
    document.getElementById("stat-alunos").textContent = String(alunos.length);
    document.getElementById("stat-fotos").textContent = String(fotos.length);
    document.getElementById("stat-salas").textContent = String(salas.size);
    document.getElementById("stat-turmas").textContent = String(turmas.size);
    document.getElementById("stat-turnos").textContent = String(turnos.size);
    document.getElementById("stat-professoras").textContent = String(professoras.length);
    document.getElementById("stat-auxiliares").textContent = String(auxiliares.length);
}
async function atualizarSelectsProfAux() {
    const professoras = await db.professoras.toArray();
    const auxiliares = await db.auxiliares.toArray();
    const selectProf = document.getElementById("cad-professora");
    const selectAux = document.getElementById("cad-auxiliar");
    selectProf.innerHTML = '<option value="">Selecione</option>';
    for (const p of professoras) {
        const opt = document.createElement("option");
        opt.value = String(p.id);
        opt.textContent = p.nome;
        selectProf.appendChild(opt);
    }
    selectAux.innerHTML = '<option value="">Nenhum</option>';
    for (const a of auxiliares) {
        const opt = document.createElement("option");
        opt.value = String(a.id);
        opt.textContent = a.nome;
        selectAux.appendChild(opt);
    }
}
function trocarTela(idNovaTelaOuBotao) {
    const alvo = document.querySelector(`[data-tela="${idNovaTelaOuBotao}"], [data-voltar="${idNovaTelaOuBotao}"]`);
    if (!alvo)
        return;
    const idNovaTelaAtual = alvo.getAttribute("data-tela") || alvo.getAttribute("data-voltar");
    if (!idNovaTelaAtual)
        return;
    // Esconde tela atual
    const telaAtualEl = document.getElementById(telaAtual);
    if (telaAtualEl) {
        telaAtualEl.classList.add("escondida");
    }
    // Mostra nova tela
    const novaTela = document.getElementById(idNovaTelaAtual);
    if (novaTela) {
        novaTela.classList.remove("escondida");
        telaAtual = idNovaTelaAtual;
        // Atualiza dados se necessário
        if (idNovaTelaAtual === "estatisticas") {
            atualizarEstatisticas();
        }
        else if (idNovaTelaAtual === "cadastro") {
            atualizarSelectsProfAux();
        }
    }
}
// ==== Handlers ====
function setupNavegacao() {
    // Botões de menu
    document.querySelectorAll(".btn-menu").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const tela = e.target.getAttribute("data-tela");
            if (tela)
                trocarTela(tela);
        });
    });
    // Botões voltar
    document.querySelectorAll(".btn-voltar").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const tela = e.target.getAttribute("data-voltar");
            if (tela)
                trocarTela(tela);
        });
    });
}
function setupCadastro() {
    const form = document.getElementById("form-cadastro");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const nome = document.getElementById("cad-nome")
            .value;
        const ra = document.getElementById("cad-ra").value;
        const ano = document.getElementById("cad-ano")
            .value;
        const sala = document.getElementById("cad-sala")
            .value;
        const turno = document.getElementById("cad-turno")
            .value;
        if (!nome || !ra || !ano || !sala || !turno) {
            mostrarBanner("Preencha os campos obrigatórios", "erro");
            return;
        }
        // Prepara aluno
        const aluno = {
            IDunico: ra.padStart(12, "0"),
            IDescolar: ra,
            nome: nome.toUpperCase(),
            info_1: document.getElementById("cad-info1").value.slice(0, 60),
            info_2: document.getElementById("cad-info2").value.slice(0, 60),
            nome_mae: document.getElementById("cad-mae").value.toUpperCase(),
            nome_pai: document.getElementById("cad-pai").value.toUpperCase(),
            tel1: document.getElementById("cad-tel1").value.replace(/\D/g, ""),
            tel2: document.getElementById("cad-tel2").value.replace(/\D/g, ""),
            dn: document.getElementById("cad-dn").value,
            ano,
            sala,
            turno,
            id_professora: parseInt(document.getElementById("cad-professora").value),
            id_auxiliar: parseInt(document.getElementById("cad-auxiliar").value),
            tem_foto: false,
        };
        await db.alunos.put(aluno);
        // Processa foto se existir
        const fotoInput = document.getElementById("cad-foto");
        if (fotoInput.files && fotoInput.files[0]) {
            const blob = fotoInput.files[0];
            if (blob.size <= 80 * 1024) {
                await db.fotos.put({ IDunico: aluno.IDunico, dados: blob });
                aluno.tem_foto = true;
                await db.alunos.put(aluno);
            }
        }
        mostrarBanner("Aluno salvo com sucesso");
        form.reset();
    });
}
function setupImportacao() {
    // Importar texto
    document.getElementById("btn-importar-texto").addEventListener("click", async () => {
        const texto = document.getElementById("import-texto")
            .value;
        if (!texto) {
            mostrarBanner("Cole dados antes de importar", "aviso");
            return;
        }
        const { alunos, erros } = await importarDeTexto(texto);
        if (alunos.length === 0) {
            mostrarBanner("Nenhum aluno importado", "erro");
            return;
        }
        // Salva alunos
        await db.alunos.bulkPut(alunos);
        const resultado = document.getElementById("import-resultado");
        resultado.className = "resultado-importacao sucesso";
        resultado.innerHTML = `<strong>Importação concluída:</strong><br>${alunos.length} alunos importados${erros.length > 0 ? `<br><strong>Erros:</strong><br>${erros.join("<br>")}` : ""}`;
        resultado.classList.remove("escondido");
        mostrarBanner(`${alunos.length} alunos importados`);
    });
    // Importar planilha
    document
        .getElementById("btn-importar-planilha")
        .addEventListener("click", async () => {
        const input = document.getElementById("import-planilha");
        if (!input.files || !input.files[0]) {
            mostrarBanner("Selecione uma planilha", "aviso");
            return;
        }
        const { alunos, erros } = await importarDePlanilha(input.files[0]);
        if (alunos.length === 0) {
            mostrarBanner("Nenhum aluno importado", "erro");
            return;
        }
        await db.alunos.bulkPut(alunos);
        const resultado = document.getElementById("import-resultado");
        resultado.className = "resultado-importacao sucesso";
        resultado.innerHTML = `<strong>Importação concluída:</strong><br>${alunos.length} alunos importados${erros.length > 0
            ? `<br><strong>Erros:</strong><br>${erros.join("<br>")}`
            : ""}`;
        resultado.classList.remove("escondido");
        mostrarBanner(`${alunos.length} alunos importados`);
    });
}
function setupFotos() {
    // Processar arquivo de foto
    async function processarFotos(files, prefixo = "") {
        if (!files)
            return;
        let contador = 0;
        for (const file of Array.from(files)) {
            if (file.size > 80 * 1024)
                continue; // Ignora acima de 80KB
            const nome = file.name.replace(/\.[^.]+$/, ""); // Remove extensão
            const nomeFinal = prefixo ? `${prefixo}${contador + 1}` : nome;
            const blob = new Blob([file], { type: file.type });
            if (prefixo) {
                await db.imagensInstitucionais.put({ nome: nomeFinal, dados: blob });
            }
            else {
                await db.fotos.put({ IDunico: nomeFinal, dados: blob });
            }
            contador++;
        }
        mostrarBanner(`${contador} imagens importadas`);
    }
    document
        .getElementById("btn-upload-fotos")
        .addEventListener("click", async () => {
        const input = document.getElementById("upload-fotos");
        if (input.files) {
            await processarFotos(input.files);
        }
        input.value = "";
    });
    document
        .getElementById("btn-upload-institucional")
        .addEventListener("click", async () => {
        const input = document.getElementById("upload-institucional");
        if (input.files) {
            await processarFotos(input.files, "institucional");
        }
        input.value = "";
    });
    document
        .getElementById("btn-import-zip-fotos")
        .addEventListener("click", async () => {
        const input = document.getElementById("import-zip-fotos");
        if (!input.files || !input.files[0]) {
            mostrarBanner("Selecione um ZIP", "aviso");
            return;
        }
        const resultado = await importarDeZIP(input.files[0]);
        if (resultado.sucesso) {
            mostrarBanner("ZIP importado com sucesso");
        }
        else {
            mostrarBanner(resultado.erro || "Erro ao importar ZIP", "erro");
        }
        input.value = "";
    });
}
function setupMensagens() {
    const container = document.getElementById("mensagens-container");
    document
        .getElementById("btn-add-mensagem")
        .addEventListener("click", () => {
        const item = document.createElement("div");
        item.className = "mensagem-item";
        item.innerHTML = `
        <textarea placeholder="Insira a mensagem aos responsáveis aqui"></textarea>
        <button type="button" class="btn-remover-msg">❌</button>
      `;
        item.querySelector(".btn-remover-msg").addEventListener("click", () => {
            item.remove();
        });
        container.appendChild(item);
    });
    // Remover primeira mensagem
    container
        .querySelector(".btn-remover-msg")
        .addEventListener("click", function () {
        this.parentElement.remove();
    });
}
function setupExportacao() {
    // Botão para importar dados do seed (500 alunos)
    document
        .getElementById("btn-importar-seed")
        .addEventListener("click", async () => {
        abrirModal("Importar 500 Alunos Fictícios", "Deseja importar os 500 alunos fictícios gerados pelo script de seed? Isso incluirá também 10 professoras e 10 auxiliares.", async () => {
            try {
                const response = await fetch("./seed-data.json");
                if (!response.ok) {
                    mostrarBanner("Arquivo seed-data.json não encontrado", "erro");
                    return;
                }
                const dadosSeed = await response.json();
                const resultado = await importarDoSeedJSON(dadosSeed);
                if (resultado.sucesso) {
                    mostrarBanner("500 alunos importados com sucesso!");
                    await atualizarEstatisticas();
                }
                else {
                    mostrarBanner(resultado.erro || "Erro ao importar", "erro");
                }
            }
            catch (e) {
                mostrarBanner(`Erro: ${String(e)}`, "erro");
            }
        }, "Importar", "Cancelar");
    });
    document
        .getElementById("btn-senha-export")
        .addEventListener("click", () => {
        const corps = document.createElement("div");
        corps.innerHTML = `
        <input type="text" id="modal-senha" placeholder="Senha (4 caracteres)" maxlength="4" />
      `;
        abrirModal("Incluir Senha", corps, () => {
            const input = document.getElementById("modal-senha");
            senhaExportacao = input.value.toUpperCase();
            mostrarBanner("Senha definida");
        }, "Confirmar", "Cancelar");
    });
    document
        .getElementById("btn-admin-export")
        .addEventListener("click", () => {
        const corps = document.createElement("div");
        corps.innerHTML = `
        <input type="tel" id="modal-admin" placeholder="Número (10 ou 11 dígitos)" />
      `;
        abrirModal("Número Administrativo", corps, () => {
            const input = document.getElementById("modal-admin");
            numAdministrativo = input.value.replace(/\D/g, "");
            mostrarBanner("Número definido");
        }, "Confirmar", "Cancelar");
    });
    document
        .getElementById("btn-exportar-zip")
        .addEventListener("click", async () => {
        try {
            const blob = await exportarParaZIP(senhaExportacao, numAdministrativo);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `orbe-dados-${new Date().toISOString().split("T")[0]}.zip`;
            a.click();
            URL.revokeObjectURL(url);
            mostrarBanner("ZIP exportado");
        }
        catch (e) {
            mostrarBanner(String(e), "erro");
        }
    });
    document
        .getElementById("btn-apagar-tudo")
        .addEventListener("click", () => {
        abrirModal("Apagar todos os dados?", "Esta ação é irreversível. Todos os dados serão removidos.", async () => {
            await db.limparTudo();
            mostrarBanner("Dados apagados");
        }, "Apagar", "Cancelar");
    });
}
// ==== Inicialização ====
async function inicializar() {
    // Aguarda banco de dados
    await db.open();
    // Configura navegação
    setupNavegacao();
    // Configura formulários
    setupCadastro();
    setupImportacao();
    setupFotos();
    setupMensagens();
    setupExportacao();
    // Rodapé
    const rodape = document.getElementById("rodape");
    const dataHoje = new Date().toISOString().split("T")[0];
    rodape.textContent = `Orbe Escolar versão ${VERSAO_ORBE} com banco de dados teste - Contato 11 978831938`;
    console.log("Orbe Escriba inicializado");
}
document.addEventListener("DOMContentLoaded", inicializar);
