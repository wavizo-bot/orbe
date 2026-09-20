import { db } from "./db";
import {
  gerarSenhaDoDia,
  gerarTodasContraSenhas,
  validarContraSenha,
  validarSenhaTeste,
  extrairDataDaSenha,
  somarMeses,
  formatarDataExibicao,
  calcularIdade,
} from "@orbe/algoritmo-senha";
import { VERSAO_ORBE, NUMERO_SUPORTE, CHAVE_DEVICE_ID } from "@orbe/constantes";
import { Aluno } from "@orbe/tipos";
import { decompress } from "fflate";

// ==== Estado Global ====
let telaAtual = "auth";
let deviceId = "";
let senhaDoDia = "";
let autenticado = false;
let dataValidadeAuth = "";
let ultimaContraSenhaHoje = false;
let alunos: Aluno[] = [];
let alunosPesquisa: Aluno[] = [];
let filtrosSelecionados = {
  salas: new Set<string>(),
  anos: new Set<string>(),
  turnos: new Set<string>(),
  professoras: new Set<number>(),
};
let historicoAlunos: string[] = [];
let conferenciaSelecionada: Set<string> = new Set();
let imagensInstitucionais: Map<string, Blob> = new Map();

// ==== Utilidades ====

function gerarOuCarregarDeviceId(): string {
  let id = localStorage.getItem(CHAVE_DEVICE_ID);
  if (!id) {
    id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    localStorage.setItem(CHAVE_DEVICE_ID, id);
  }
  return id;
}

function mostrarBanner(msg: string, tipo: "sucesso" | "erro" = "sucesso") {
  const banner = document.getElementById("banner")!;
  banner.textContent = msg;
  banner.className = `banner ${tipo === "sucesso" ? "" : tipo}`;
  banner.classList.remove("escondido");
  setTimeout(() => {
    banner.classList.add("escondido");
  }, 2000);
}

function trocarTela(novaTela: string) {
  document.querySelectorAll(".tela").forEach((t) => t.classList.add("escondida"));
  const el = document.getElementById(`tela-${novaTela}`);
  if (el) {
    el.classList.remove("escondida");
    telaAtual = novaTela;
  }
}

function abrirModal(
  titulo: string,
  corpo: string | HTMLElement,
  onConfirmar: () => void = () => {},
  textoConfirmar: string = "Confirmar"
) {
  const modal = document.getElementById("modal")!;
  const modalTitulo = document.getElementById("modal-titulo")!;
  const modalCorpo = document.getElementById("modal-corpo")!;
  const btnConfirmar = document.getElementById("modal-confirmar")!;

  modalTitulo.textContent = titulo;
  if (typeof corpo === "string") {
    modalCorpo.innerHTML = corpo;
  } else {
    modalCorpo.innerHTML = "";
    modalCorpo.appendChild(corpo);
  }
  btnConfirmar.textContent = textoConfirmar;
  btnConfirmar.onclick = () => {
    onConfirmar();
    modal.classList.add("escondido");
  };
  modal.classList.remove("escondido");
}

// ==== Autenticação ====

async function inicializarAutenticacao() {
  deviceId = gerarOuCarregarDeviceId();

  // Gera senha do dia
  const dataLocal = new Date();
  senhaDoDia = await gerarSenhaDoDia(deviceId, dataLocal);

  // Exibe senha
  const exibicao = document.getElementById("auth-senha-exibida") as HTMLInputElement;
  exibicao.value = senhaDoDia;

  // Verifica se já autenticado
  const estado = await db.getEstadoAutenticacao();
  if (
    estado.autenticado &&
    new Date(estado.dataValidade) > new Date()
  ) {
    autenticado = true;
    dataValidadeAuth = estado.dataValidade;
    ultimaContraSenhaHoje = estado.ultimaContraSenhaHoje;
    abrirMenuPrincipal();
  }
}

async function validarContraSenhaDigitada(contrassenhaDigitada: string) {
  const contrassenhaLower = contrassenhaDigitada.toLowerCase();

  // Testa "teste"
  if (validarSenhaTeste(contrassenhaLower)) {
    autenticado = true;
    dataValidadeAuth = new Date("2026-12-31").toISOString().split("T")[0];
    ultimaContraSenhaHoje = true;

    await db.setEstadoAutenticacao({
      autenticado: true,
      dataValidade: dataValidadeAuth,
      ultimaContraSenhaHoje: true,
    });

    mostrarBanner("Validação concluída");
    setTimeout(() => abrirMenuPrincipal(), 1500);
    return;
  }

  // Testa as 4 contra-senhas
  const todasContraSenhas = await gerarTodasContraSenhas(senhaDoDia);

  for (const [tipo, contraSenha] of Object.entries(todasContraSenhas)) {
    if (contraSenha === contrassenhaLower) {
      // Acertou
      autenticado = true;

      // Soma meses
      const meses = parseInt(tipo.replace("m", ""));
      let novaValidade = new Date();
      if (dataValidadeAuth && new Date(dataValidadeAuth) > new Date()) {
        novaValidade = new Date(dataValidadeAuth);
      }
      novaValidade = somarMeses(novaValidade, meses);
      dataValidadeAuth = novaValidade.toISOString().split("T")[0];

      await db.setEstadoAutenticacao({
        autenticado: true,
        dataValidade: dataValidadeAuth,
        ultimaContraSenhaHoje: true,
      });

      mostrarBanner("Validação concluída");
      setTimeout(() => abrirMenuPrincipal(), 1500);
      return;
    }
  }

  // Errou
  mostrarBanner("Senha incorreta", "erro");
  (document.getElementById("auth-contrassenha") as HTMLInputElement).value =
    "";
}

// ==== Menu Principal ====

async function abrirMenuPrincipal() {
  // Carrega alunos
  alunos = await db.alunos.toArray();

  // Carrega imagens institucionais
  const imgs = await db.imagensInstitucionais.toArray();
  imagensInstitucionais.clear();
  for (const img of imgs) {
    imagensInstitucionais.set(img.nome, img.dados);
  }

  // Exibe imagens no menu
  const menuImgs = document.getElementById("menu-imagens")!;
  menuImgs.innerHTML = "";

  if (imagensInstitucionais.size === 1) {
    const blob = Array.from(imagensInstitucionais.values())[0];
    const url = URL.createObjectURL(blob);
    const img = document.createElement("img");
    img.src = url;
    img.style.width = "100%";
    img.style.borderRadius = "8px";
    menuImgs.appendChild(img);
  } else if (imagensInstitucionais.size === 2) {
    const [blob1, blob2] = Array.from(imagensInstitucionais.values());
    const div = document.createElement("div");
    div.style.display = "flex";
    div.style.gap = "8px";

    for (const blob of [blob1, blob2]) {
      const url = URL.createObjectURL(blob);
      const img = document.createElement("img");
      img.src = url;
      img.style.flex = "1";
      img.style.borderRadius = "4px";
      div.appendChild(img);
    }

    menuImgs.appendChild(div);
  }

  // Esconde tela de auth e abre menu
  trocarTela("menu");
}

// ==== Alunos ====

async function renderizarAlunos(lista: Aluno[]) {
  const container = document.getElementById("lista-alunos")!;
  container.innerHTML = "";

  if (lista.length === 0) {
    container.innerHTML = '<p style="padding: 16px;">Nenhum aluno encontrado</p>';
    return;
  }

  for (const aluno of lista) {
    const cartao = document.createElement("div");
    cartao.className = "cartao";
    cartao.style.marginBottom = "8px";
    cartao.innerHTML = `
      <div class="cartao-conteudo">
        <div class="cartao-info">
          <h3>${aluno.nome}</h3>
          <p>${aluno.ano} ${aluno.sala} ${aluno.turno}</p>
        </div>
        <button class="btn-acao" data-aluno="${aluno.IDunico}">📝</button>
      </div>
    `;
    cartao.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).tagName !== "BUTTON") {
        abrirPerfilAluno(aluno);
      }
    });

    cartao
      .querySelector("button")!
      .addEventListener("click", async () => {
        const texto = `${aluno.nome} ${aluno.ano} ${aluno.sala} ${aluno.turno}`;
        await navigator.clipboard.writeText(texto);
        mostrarBanner("Copiado");
      });

    container.appendChild(cartao);
  }
}

async function buscarAlunos(termo: string) {
  if (!termo.trim()) {
    alunosPesquisa = [];
    renderizarAlunos([]);
    return;
  }

  alunosPesquisa = await db.buscarAlunos(termo);
  renderizarAlunos(alunosPesquisa);

  // Adiciona ao histórico
  if (!historicoAlunos.includes(termo)) {
    historicoAlunos.unshift(termo);
    historicoAlunos = historicoAlunos.slice(0, 3);
  }
}

function abrirPerfilAluno(aluno: Aluno) {
  const container = document.getElementById("perfil-conteudo")!;
  container.innerHTML = "";

  // Busca foto
  db.fotos.get(aluno.IDunico).then((fotoObj) => {
    const perfilHeader = document.createElement("div");
    perfilHeader.className = "perfil-header";

    if (fotoObj) {
      const url = URL.createObjectURL(fotoObj.dados);
      const img = document.createElement("img");
      img.src = url;
      img.className = "perfil-foto";
      perfilHeader.appendChild(img);
    } else {
      const placeholder = document.createElement("img");
      placeholder.src = "src/assets/perfilsemfoto.jpg";
      placeholder.className = "perfil-foto";
      placeholder.style.backgroundColor = "#f0f0f0";
      perfilHeader.appendChild(placeholder);
    }

    const infos = document.createElement("div");
    infos.className = "perfil-info";

    if (aluno.info_1) {
      const info1 = document.createElement("div");
      info1.className = "info-destaque";
      info1.textContent = aluno.info_1;
      infos.appendChild(info1);
    }

    const nome = document.createElement("h2");
    nome.textContent = aluno.nome;
    infos.appendChild(nome);

    const ra = document.createElement("p");
    ra.style.fontSize = "13px";
    ra.textContent = `RA: ${aluno.IDescolar}`;
    infos.appendChild(ra);

    if (aluno.info_2) {
      const info2 = document.createElement("p");
      info2.textContent = aluno.info_2;
      infos.appendChild(info2);
    }

    perfilHeader.appendChild(infos);
    container.appendChild(perfilHeader);

    // Seção de dados
    const secao = document.createElement("div");
    secao.className = "perfil-secao";

    if (aluno.nome_mae) {
      const p = document.createElement("p");
      p.innerHTML = `<strong>${aluno.nome_mae}</strong> (Responsável 1)`;
      secao.appendChild(p);
    }

    if (aluno.nome_pai) {
      const p = document.createElement("p");
      p.innerHTML = `<strong>${aluno.nome_pai}</strong> (Responsável 2)`;
      secao.appendChild(p);
    }

    if (aluno.tel1) {
      const p = document.createElement("p");
      const a = document.createElement("a");
      a.href = `https://wa.me/55${aluno.tel1}`;
      a.textContent = `☎️ ${aluno.tel1}`;
      a.target = "_blank";
      p.appendChild(a);
      secao.appendChild(p);
    }

    if (aluno.tel2) {
      const p = document.createElement("p");
      const a = document.createElement("a");
      a.href = `https://wa.me/55${aluno.tel2}`;
      a.textContent = `☎️ ${aluno.tel2}`;
      a.target = "_blank";
      p.appendChild(a);
      secao.appendChild(p);
    }

    if (aluno.dn) {
      const idade = calcularIdade(aluno.dn);
      const p = document.createElement("p");
      p.textContent = `Data nascimento: ${formatarDataExibicao(
        aluno.dn
      )} (${idade} anos)`;
      secao.appendChild(p);
    }

    const p2 = document.createElement("p");
    p2.textContent = `${aluno.ano} | ${aluno.sala} | ${aluno.turno}`;
    secao.appendChild(p2);

    container.appendChild(secao);
  });

  trocarTela("perfil");
}

// ==== Grupos e Conferência ====

async function renderizarFiltros() {
  const todasSalas = new Set(alunos.map((a) => a.sala));
  const todosAnos = new Set(alunos.map((a) => a.ano));
  const todosTurnos = new Set(alunos.map((a) => a.turno));
  const todasProfessoras = await db.professoras.toArray();

  // Salas
  const divSalas = document.getElementById("filtro-salas")!;
  divSalas.innerHTML = "";
  for (const sala of Array.from(todasSalas).sort()) {
    const btn = document.createElement("button");
    btn.className = filtrosSelecionados.salas.has(sala) ? "btn-status verde" : "btn-secondary";
    btn.textContent = sala;
    btn.addEventListener("click", () => {
      if (filtrosSelecionados.salas.has(sala)) {
        filtrosSelecionados.salas.delete(sala);
      } else {
        filtrosSelecionados.salas.add(sala);
      }
      renderizarFiltros();
      atualizarBotaoMostrar();
    });
    divSalas.appendChild(btn);
  }

  // Anos
  const divAnos = document.getElementById("filtro-anos")!;
  divAnos.innerHTML = "";
  for (const ano of Array.from(todosAnos).sort()) {
    const btn = document.createElement("button");
    btn.className = filtrosSelecionados.anos.has(ano) ? "btn-status verde" : "btn-secondary";
    btn.textContent = ano;
    btn.addEventListener("click", () => {
      if (filtrosSelecionados.anos.has(ano)) {
        filtrosSelecionados.anos.delete(ano);
      } else {
        filtrosSelecionados.anos.add(ano);
      }
      renderizarFiltros();
      atualizarBotaoMostrar();
    });
    divAnos.appendChild(btn);
  }

  // Turnos
  const divTurnos = document.getElementById("filtro-turnos")!;
  divTurnos.innerHTML = "";
  for (const turno of Array.from(todosTurnos).sort()) {
    const btn = document.createElement("button");
    btn.className = filtrosSelecionados.turnos.has(turno) ? "btn-status verde" : "btn-secondary";
    btn.textContent = turno;
    btn.addEventListener("click", () => {
      if (filtrosSelecionados.turnos.has(turno)) {
        filtrosSelecionados.turnos.delete(turno);
      } else {
        filtrosSelecionados.turnos.add(turno);
      }
      renderizarFiltros();
      atualizarBotaoMostrar();
    });
    divTurnos.appendChild(btn);
  }

  // Professoras
  const divProf = document.getElementById("filtro-professoras")!;
  divProf.innerHTML = "";
  for (const prof of todasProfessoras) {
    const btn = document.createElement("button");
    btn.className = filtrosSelecionados.professoras.has(prof.id) ? "btn-status verde" : "btn-secondary";
    btn.textContent = `Profª ${prof.nome}`;
    btn.addEventListener("click", () => {
      if (filtrosSelecionados.professoras.has(prof.id)) {
        filtrosSelecionados.professoras.delete(prof.id);
      } else {
        filtrosSelecionados.professoras.add(prof.id);
      }
      renderizarFiltros();
      atualizarBotaoMostrar();
    });
    divProf.appendChild(btn);
  }
}

function atualizarBotaoMostrar() {
  const alunosFiltr = alunos.filter(
    (a) =>
      (filtrosSelecionados.salas.size === 0 ||
        filtrosSelecionados.salas.has(a.sala)) &&
      (filtrosSelecionados.anos.size === 0 || filtrosSelecionados.anos.has(a.ano)) &&
      (filtrosSelecionados.turnos.size === 0 ||
        filtrosSelecionados.turnos.has(a.turno)) &&
      (filtrosSelecionados.professoras.size === 0 ||
        filtrosSelecionados.professoras.has(a.id_professora))
  );

  const btn = document.getElementById("btn-mostrar-alunos")!;
  btn.textContent = `MOSTRAR ${alunosFiltr.length} ALUNOS`;

  btn.addEventListener("click", () => {
    abrirConferencia(alunosFiltr);
  });
}

async function abrirConferencia(lista: Aluno[]) {
  const container = document.getElementById("conferencia-lista")!;
  container.innerHTML = "";

  // Ordena: verdes primeiro, depois amarelos, depois neutros
  lista.sort((a, b) => {
    const estadoA = conferenciaSelecionada.has(a.IDunico) ? "verde" : "padrao";
    const estadoB = conferenciaSelecionada.has(b.IDunico) ? "verde" : "padrao";

    const ordem: Record<string, number> = { verde: 0, amarelo: 1, padrao: 2 };
    return ordem[estadoA] - ordem[estadoB];
  });

  for (const aluno of lista) {
    const selecionado = conferenciaSelecionada.has(aluno.IDunico);
    const estado = selecionado ? "verde" : "padrao";

    const cartao = document.createElement("div");
    cartao.className = `cartao-conferencia ${estado}`;
    cartao.textContent = aluno.nome;

    cartao.addEventListener("click", () => {
      if (conferenciaSelecionada.has(aluno.IDunico)) {
        conferenciaSelecionada.delete(aluno.IDunico);
      } else {
        conferenciaSelecionada.add(aluno.IDunico);
      }
      abrirConferencia(lista);
    });

    container.appendChild(cartao);
  }

  trocarTela("conferencia");
}

// ==== Importação ====

async function importarZIP(arquivo: File) {
  try {
    const buffer = await arquivo.arrayBuffer();
    const dados = await new Promise<Record<string, Uint8Array>>(
      (resolve, reject) => {
        decompress(new Uint8Array(buffer), (err, data) => {
          if (err) reject(err);
          else resolve(data as any);
        });
      }
    );

    const alunos = JSON.parse(
      new TextDecoder().decode(dados["alunos.json"])
    ).alunos;
    const professoras = JSON.parse(
      new TextDecoder().decode(dados["professoras.json"])
    ).professoras;
    const auxiliares = JSON.parse(
      new TextDecoder().decode(dados["auxiliares.json"])
    ).auxiliares;
    const mensagens = JSON.parse(
      new TextDecoder().decode(dados["mensagens.json"])
    ).mensagens;
    const config = JSON.parse(new TextDecoder().decode(dados["config.json"]));

    await db.carregarDoJSON({
      alunos,
      professoras,
      auxiliares,
      mensagens,
      config,
    });

    // Processa fotos
    for (const [chave, dados] of Object.entries(dados)) {
      if (chave.startsWith("fotos/")) {
        const IDunico = chave.replace("fotos/", "").split(".")[0];
        const blob = new Blob([dados]);
        await db.fotos.put({ IDunico, dados: blob });
      }
      if (chave.startsWith("institucional/")) {
        const nome = chave.replace("institucional/", "").split(".")[0];
        const blob = new Blob([dados]);
        await db.imagensInstitucionais.put({ nome, dados: blob });
      }
    }

    mostrarBanner("ZIP importado com sucesso");
  } catch (e) {
    mostrarBanner(`Erro: ${String(e)}`, "erro");
  }
}

// ==== Inicialização ====

async function inicializar() {
  await db.open();

  // Autenticação
  await inicializarAutenticacao();

  // Navegação da tela alunos
  document
    .getElementById("input-busca-alunos")!
    .addEventListener("input", (e) => {
      const termo = (e.target as HTMLInputElement).value;
      buscarAlunos(termo);
    });

  document.getElementById("btn-limpar-busca")!.addEventListener("click", () => {
    (document.getElementById("input-busca-alunos") as HTMLInputElement).value =
      "";
    buscarAlunos("");
  });

  // Botões de menu
  document.querySelectorAll("[data-tela]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const tela = (e.target as HTMLElement).getAttribute("data-tela");
      if (tela) {
        if (tela === "alunos") {
          buscarAlunos("");
        } else if (tela === "grupos") {
          renderizarFiltros();
          atualizarBotaoMostrar();
        }
        trocarTela(tela);
      }
    });
  });

  // Botões voltar
  document.querySelectorAll("[data-voltar]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const tela = (e.target as HTMLElement).getAttribute("data-voltar");
      if (tela) trocarTela(tela);
    });
  });

  // Autenticação
  document
    .getElementById("btn-copiar-senha")!
    .addEventListener("click", async () => {
      await navigator.clipboard.writeText(senhaDoDia);
      mostrarBanner("Copiado");
    });

  document
    .getElementById("btn-whatsapp-suporte")!
    .addEventListener("click", () => {
      const mensagem = `Olá, preciso de contra-senha. Minha senha é: ${senhaDoDia}`;
      const url = `https://wa.me/${NUMERO_SUPORTE}?text=${encodeURIComponent(mensagem)}`;
      window.open(url, "_blank");
    });

  document
    .getElementById("btn-colar-contrassenha")!
    .addEventListener("click", async () => {
      const texto = await navigator.clipboard.readText();
      (document.getElementById("auth-contrassenha") as HTMLInputElement).value =
        texto;
    });

  document
    .getElementById("btn-validar")!
    .addEventListener("click", async () => {
      const contrassenha = (
        document.getElementById("auth-contrassenha") as HTMLInputElement
      ).value;
      await validarContraSenhaDigitada(contrassenha);
    });

  // Configurações
  document
    .getElementById("btn-importar-zip")!
    .addEventListener("click", () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".zip";
      input.addEventListener("change", (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) importarZIP(file);
      });
      input.click();
    });

  // Conferência
  document
    .getElementById("btn-copiar-conferencia")!
    .addEventListener("click", async () => {
      const selecionados = Array.from(conferenciaSelecionada).join(", ");
      await navigator.clipboard.writeText(selecionados);
      mostrarBanner("Copiado");
    });

  document
    .getElementById("btn-enviar-conferencia")!
    .addEventListener("click", () => {
      const selecionados = Array.from(conferenciaSelecionada).join("|");
      const url = `https://wa.me/${NUMERO_SUPORTE}?text=${encodeURIComponent(selecionados)}`;
      window.open(url, "_blank");
    });

  document
    .getElementById("btn-apagar-conferencia")!
    .addEventListener("click", () => {
      conferenciaSelecionada.clear();
      mostrarBanner("Conferência limpa");
    });

  console.log("Orbe App inicializado");
}

document.addEventListener("DOMContentLoaded", inicializar);
