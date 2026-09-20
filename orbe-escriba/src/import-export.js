import * as Papa from "papaparse";
import * as XLSX from "xlsx";
import { compress, decompress } from "fflate";
import { LIMITE_INFO } from "@orbe/constantes";
import { db } from "./db";
/**
 * Normaliza telefone: remove tudo que não é número
 */
export function normalizarTelefone(tel) {
    return tel.replace(/\D/g, "").slice(-11);
}
/**
 * Converte IDescolar para IDunico (12 dígitos)
 */
export function gerarIDunico(IDescolar) {
    return IDescolar.padStart(12, "0");
}
/**
 * Valida aluno
 */
export function validarAluno(aluno) {
    const nome = String(aluno.nome || aluno.nome_aluno || "").trim();
    const IDescolar = String(aluno.IDescolar || aluno.RA || "")
        .replace(/\D/g, "")
        .slice(0, 12);
    if (!nome || !IDescolar)
        return null;
    const dn = String(aluno.dn || aluno.data_nascimento || "").trim();
    const ano = String(aluno.ano || "").trim();
    const sala = String(aluno.sala || "").trim();
    const turno = String(aluno.turno || "").toLowerCase().trim();
    if (!ano || !sala || !turno)
        return null;
    const tel1 = normalizarTelefone(String(aluno.tel1 || ""));
    const tel2 = normalizarTelefone(String(aluno.tel2 || ""));
    let info_1 = String(aluno.info_1 || "").trim();
    let info_2 = String(aluno.info_2 || "").trim();
    // Corta no limite de caracteres visíveis
    if (info_1.length > LIMITE_INFO)
        info_1 = info_1.slice(0, LIMITE_INFO);
    if (info_2.length > LIMITE_INFO)
        info_2 = info_2.slice(0, LIMITE_INFO);
    return {
        IDunico: gerarIDunico(IDescolar),
        IDescolar,
        nome: nome.toUpperCase(),
        info_1,
        info_2,
        nome_mae: String(aluno.nome_mae || "").toUpperCase().trim(),
        nome_pai: String(aluno.nome_pai || "").toUpperCase().trim(),
        tel1,
        tel2,
        dn,
        ano,
        sala,
        turno,
        id_professora: 0, // será preenchido pelo UI
        id_auxiliar: 0,
        tem_foto: false,
    };
}
/**
 * Importa alunos de CSV/TSV/TXT
 */
export async function importarDeTexto(texto) {
    const resultado = Papa.parse(texto, {
        header: true,
        skipEmptyLines: true,
    });
    const alunos = [];
    const erros = [];
    if (!resultado.data || resultado.data.length === 0) {
        return { alunos, erros: ["Nenhum dado encontrado"] };
    }
    const linhas = resultado.data;
    for (let i = 0; i < linhas.length; i++) {
        const linha = linhas[i];
        const aluno = validarAluno(linha);
        if (aluno) {
            alunos.push(aluno);
        }
        else {
            erros.push(`Linha ${i + 1}: dados inválidos ou incompletos`);
        }
    }
    return { alunos, erros };
}
/**
 * Importa alunos de planilha XLS/XLSX/ODS
 */
export async function importarDePlanilha(arquivo) {
    const alunos = [];
    const erros = [];
    try {
        const arrayBuffer = await arquivo.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        if (!worksheet) {
            return { alunos, erros: ["Planilha não encontrada"] };
        }
        const dados = XLSX.utils.sheet_to_json(worksheet);
        if (dados.length === 0) {
            return { alunos, erros: ["Nenhum dado encontrado"] };
        }
        for (let i = 0; i < dados.length; i++) {
            const aluno = validarAluno(dados[i]);
            if (aluno) {
                alunos.push(aluno);
            }
            else {
                erros.push(`Linha ${i + 1}: dados inválidos ou incompletos`);
            }
        }
    }
    catch (e) {
        erros.push(`Erro ao ler planilha: ${String(e)}`);
    }
    return { alunos, erros };
}
/**
 * Cria ZIP de exportação
 */
export async function exportarParaZIP(senhaInicial = "", numAdministrativo = "") {
    const dados = await db.exportarParaJSON();
    // Prepara manifest
    const manifest = {
        versao: 1,
        gerado_em: new Date().toISOString(),
        gerado_por: "orbe-escriba",
        total_alunos: dados.alunos.length,
        total_alunos_com_foto: 0, // será atualizado depois
        total_salas: new Set(dados.alunos.map((a) => a.sala)).size,
        total_turmas: new Set(dados.alunos.map((a) => `${a.ano}-${a.sala}`)).size,
        total_turnos: new Set(dados.alunos.map((a) => a.turno)).size,
        total_professoras: dados.professoras.length,
        total_auxiliares: dados.auxiliares.length,
    };
    // Prepara config
    const config = {
        versao: 1,
        num_arauto: numAdministrativo,
        senha_inicial: senhaInicial,
        atualizado_em: new Date().toISOString().split("T")[0],
    };
    // Monta estrutura do ZIP
    const arquivos = {
        "manifest.json": new TextEncoder().encode(JSON.stringify(manifest, null, 2)),
        "alunos.json": new TextEncoder().encode(JSON.stringify({ versao: 1, alunos: dados.alunos }, null, 2)),
        "professoras.json": new TextEncoder().encode(JSON.stringify({ versao: 1, professoras: dados.professoras }, null, 2)),
        "auxiliares.json": new TextEncoder().encode(JSON.stringify({ versao: 1, auxiliares: dados.auxiliares }, null, 2)),
        "mensagens.json": new TextEncoder().encode(JSON.stringify({ versao: 1, mensagens: dados.mensagens }, null, 2)),
        "config.json": new TextEncoder().encode(JSON.stringify(config, null, 2)),
    };
    // Pega fotos do IndexedDB
    const fotos = await db.fotos.toArray();
    for (const foto of fotos) {
        const ext = await detectorExtensaoImagem(foto.dados);
        if (ext) {
            arquivos[`fotos/${foto.IDunico}.${ext}`] = new Uint8Array(await foto.dados.arrayBuffer());
        }
    }
    // Pega imagens institucionais
    const institucionais = await db.imagensInstitucionais.toArray();
    for (const inst of institucionais) {
        const ext = await detectorExtensaoImagem(inst.dados);
        if (ext) {
            arquivos[`institucional/${inst.nome}.${ext}`] = new Uint8Array(await inst.dados.arrayBuffer());
        }
    }
    // Comprime em ZIP
    return new Promise((resolve, reject) => {
        compress(arquivos, (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(new Blob([data], { type: "application/zip" }));
            }
        });
    });
}
/**
 * Detecta extensão de imagem a partir do Blob
 */
async function detectorExtensaoImagem(blob) {
    const buffer = await blob.arrayBuffer();
    const view = new Uint8Array(buffer);
    // Magic bytes
    if (view[0] === 0xff && view[1] === 0xd8)
        return "jpg";
    if (view[0] === 0x89 && view[1] === 0x50)
        return "png";
    if (view[0] === 0x47 && view[1] === 0x49)
        return "gif";
    if (view[0] === 0x52 && view[1] === 0x49)
        return "webp";
    return null;
}
/**
 * Importa dados diretamente do JSON gerado pelo seed
 */
export async function importarDoSeedJSON(dadosSeed) {
    try {
        // Mapeia professores do formato seed para o formato do sistema
        const professorasMapeadas = dadosSeed.professoras.map((p) => ({
            id: p.id,
            nome: p.nome,
            email: p.email || "",
            telefone: p.telefone || "",
        }));
        // Mapeia auxiliares
        const auxiliaresMapeados = dadosSeed.auxiliares.map((a) => ({
            id: a.id,
            nome: a.nome,
            email: a.email || "",
            telefone: a.telefone || "",
        }));
        // Mapeia alunos do formato seed para o formato do sistema
        const alunosMapeados = dadosSeed.alunos.map((aluno) => ({
            IDunico: aluno.IDunico,
            IDescolar: aluno.IDescolar,
            nome: aluno.nome,
            info_1: aluno.observacoes || "",
            info_2: "",
            nome_mae: "",
            nome_pai: "",
            tel1: "",
            tel2: "",
            dn: "",
            ano: String(aluno.ano),
            sala: aluno.turma,
            turno: aluno.turno,
            id_professora: aluno.professoraId,
            id_auxiliar: aluno.auxiliarId,
            tem_foto: false,
        }));
        // Carrega no banco
        await db.carregarDoJSON({
            alunos: alunosMapeados,
            professoras: professorasMapeadas,
            auxiliares: auxiliaresMapeados,
            mensagens: dadosSeed.mensagens || [],
            config: dadosSeed.config || undefined,
        });
        return { sucesso: true };
    }
    catch (e) {
        return { sucesso: false, erro: `Erro ao importar dados: ${String(e)}` };
    }
}
/**
 * Importa ZIP (para app consumidor)
 */
export async function importarDeZIP(arquivo) {
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
        // Parse dos JSONs
        const alunos = JSON.parse(new TextDecoder().decode(dados["alunos.json"])).alunos;
        const professoras = JSON.parse(new TextDecoder().decode(dados["professoras.json"])).professoras;
        const auxiliares = JSON.parse(new TextDecoder().decode(dados["auxiliares.json"])).auxiliares;
        const mensagens = JSON.parse(new TextDecoder().decode(dados["mensagens.json"])).mensagens;
        const config = JSON.parse(new TextDecoder().decode(dados["config.json"]));
        // Carrega no banco
        await db.carregarDoJSON({
            alunos,
            professoras,
            auxiliares,
            mensagens,
            config,
        });
        // Processa fotos
        for (const [chave, bytes] of Object.entries(dados)) {
            if (chave.startsWith("fotos/")) {
                const IDunico = chave.replace("fotos/", "").split(".")[0];
                const blob = new Blob([bytes.buffer]);
                await db.fotos.put({ IDunico, dados: blob });
            }
            if (chave.startsWith("institucional/")) {
                const nome = chave.replace("institucional/", "").split(".")[0];
                const blob = new Blob([bytes.buffer]);
                await db.imagensInstitucionais.put({ nome, dados: blob });
            }
        }
        return { sucesso: true };
    }
    catch (e) {
        return { sucesso: false, erro: `Erro ao importar ZIP: ${String(e)}` };
    }
}
