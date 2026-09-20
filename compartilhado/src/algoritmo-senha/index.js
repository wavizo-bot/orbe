import { ALFABETO, SALT_SENHA, SALT_CONTRA, DATA_BASE_AUTENTICACAO, } from "../constantes/index.js";
/**
 * Gera hash SHA-256 de uma string
 */
export async function gerarSHA256(texto) {
    const encoder = new TextEncoder();
    const dados = encoder.encode(texto);
    const hashBuffer = await crypto.subtle.digest("SHA-256", dados);
    return new Uint8Array(hashBuffer);
}
/**
 * Converte bytes para base62
 */
function bytesParaBase62(bytes, quantos) {
    let resultado = "";
    for (let i = 0; i < quantos && i < bytes.length; i++) {
        const indice = bytes[i] % 62;
        resultado += ALFABETO[indice];
    }
    return resultado;
}
/**
 * Converte número para base62
 */
function numeroParaBase62(numero, minDigitos = 1) {
    if (numero === 0)
        return "0".padStart(minDigitos, "0");
    let resultado = "";
    let n = numero;
    while (n > 0) {
        resultado = ALFABETO[n % 62] + resultado;
        n = Math.floor(n / 62);
    }
    return resultado.padStart(minDigitos, "0");
}
/**
 * Converte base62 para número
 */
function base62ParaNumero(texto) {
    let resultado = 0;
    for (const char of texto) {
        const indice = ALFABETO.indexOf(char);
        if (indice === -1)
            return 0;
        resultado = resultado * 62 + indice;
    }
    return resultado;
}
/**
 * Calcula dias desde a data base
 */
export function calcularDiasDesdeBase(dataLocal = new Date()) {
    const msPerDay = 24 * 60 * 60 * 1000;
    const base = new Date(DATA_BASE_AUTENTICACAO);
    base.setHours(0, 0, 0, 0);
    dataLocal.setHours(0, 0, 0, 0);
    return Math.floor((dataLocal.getTime() - base.getTime()) / msPerDay) + 1;
}
/**
 * Gera a senha do dia (8 caracteres)
 */
export async function gerarSenhaDoDia(deviceId, dataLocal = new Date()) {
    // Parte dispositivo (5 caracteres)
    const hash = await gerarSHA256(deviceId + "|" + SALT_SENHA);
    const parteDisp = bytesParaBase62(hash, 5);
    // Parte data (3 caracteres)
    const dias = calcularDiasDesdeBase(dataLocal);
    const parteData = numeroParaBase62(dias, 3);
    return parteDisp + parteData;
}
/**
 * Extrai a data da senha do dia
 */
export function extrairDataDaSenha(senha) {
    if (senha.length !== 8)
        return null;
    const parteData = senha.slice(5, 8);
    const dias = base62ParaNumero(parteData);
    if (dias <= 0)
        return null;
    const base = new Date(DATA_BASE_AUTENTICACAO);
    base.setDate(base.getDate() + dias - 1);
    return base;
}
/**
 * Gera uma contra-senha específica
 */
export async function gerarContraSenha(senha, tipo) {
    const tipoNum = tipo.replace("m", "");
    const hash = await gerarSHA256(senha + "|" + SALT_CONTRA + "|" + tipoNum);
    return bytesParaBase62(hash, 8);
}
/**
 * Gera todas as 4 contra-senhas
 */
export async function gerarTodasContraSenhas(senha) {
    const tipos = ["1m", "3m", "6m", "12m"];
    const resultado = {
        "1m": "",
        "3m": "",
        "6m": "",
        "12m": "",
    };
    for (const tipo of tipos) {
        resultado[tipo] = await gerarContraSenha(senha, tipo);
    }
    return resultado;
}
/**
 * Valida uma contra-senha contra uma senha do dia
 */
export async function validarContraSenha(senha, contraSenhaDigitada, tipo) {
    const contraSenhaCorreta = await gerarContraSenha(senha, tipo);
    return contraSenhaCorreta === contraSenhaDigitada;
}
/**
 * Valida contra-senha "teste" (válida até 31/12/2026)
 */
export function validarSenhaTeste(senhaDigitada, dataAtual = new Date()) {
    const DATA_VALIDADE_TESTE = new Date("2026-12-31");
    return senhaDigitada === "teste" && dataAtual <= DATA_VALIDADE_TESTE;
}
/**
 * Soma meses a uma data
 */
export function somarMeses(data, meses) {
    const resultado = new Date(data);
    resultado.setMonth(resultado.getMonth() + meses);
    return resultado;
}
/**
 * Formata data para exibição (DD/MM/AA)
 */
export function formatarDataExibicao(data) {
    if (typeof data === "string") {
        // Assume formato YYYY-MM-DD
        const [ano, mes, dia] = data.split("-");
        const anoAbreviado = ano.slice(2);
        return `${dia}/${mes}/${anoAbreviado}`;
    }
    const dia = String(data.getDate()).padStart(2, "0");
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const anoAbreviado = String(data.getFullYear()).slice(2);
    return `${dia}/${mes}/${anoAbreviado}`;
}
/**
 * Calcula idade a partir da data de nascimento
 */
export function calcularIdade(dataNascimento) {
    const [ano, mes, dia] = dataNascimento.split("-").map(Number);
    const nascimento = new Date(ano, mes - 1, dia);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const mesNasc = nascimento.getMonth();
    if (mesAtual < mesNasc || (mesAtual === mesNasc && hoje.getDate() < dia)) {
        idade--;
    }
    return idade;
}
