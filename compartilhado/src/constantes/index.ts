// Versão dos apps
export const VERSAO_ORBE = "1.0.0";

// Autenticação
export const SALT_SENHA = "ORBE-AUTH-v1";
export const SALT_CONTRA = "ORBE-CONTRA-v1";
export const DATA_BASE_AUTENTICACAO = new Date("2026-01-01");
export const NUMERO_SUPORTE = "5511978831938";

// Alfabeto base62
export const ALFABETO =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Limites
export const LIMITE_INFO = 60; // caracteres visíveis
export const LIMITE_CAMPOS_MENSAGENS = 30;
export const LIMITE_IMAGEM_KB = 80;
export const TAMANHO_FOTO = 192; // pixels (192x192)

// Formatos aceitos
export const FORMATOS_IMAGEM = ["avif", "webp", "jpg", "jpeg", "png"];
export const FORMATOS_PLANILHA = ["csv", "tsv", "txt", "xls", "xlsx", "ods"];

// Padrões
export const PADRAO_IMAGEM = "perfilsemfoto.jpg";

// IndexedDB
export const DB_NOME = "orbe-dados";
export const DB_VERSAO = 1;

// Armazenamento local
export const CHAVE_DEVICE_ID = "orbe.device_id";
export const CHAVE_CONFIGS_APP = "orbe.configs";
export const CHAVE_FILTROS = "orbe.filtros";
export const CHAVE_HISTORICO_BUSCA = "orbe.historico_busca";

// Emojis e caracteres especiais
export const EMOTICONS = {
  check: "✅",
  X: "❌",
  seta_voltar: "⬅️",
  seta_enviar: "📤",
  seta_cola: "↘️",
  copiar: "📝",
  whatsapp: "📲",
  telefone: "☎️",
  foto: "📷",
  engrenagem: "⚙️",
  escudo: "🛡️",
  corrente: "🔒",
  recarregar: "🔃",
  adicionar: "➕",
  pergunta: "❓",
  quadrado_verde: "🟩",
  quadrado_amarelo: "🟨",
  estatisticas: "📊",
  usuario: "👤",
  usuarios: "👥",
  mensagens: "💬",
  paleta: "🎨",
  correo: "📨",
  importar: "📥",
  numero: "🔢",
  apagar: "🗑️",
};

// Prazos de contra-senha (em meses)
export const PRAZOS_CONTRA_SENHA = [1, 3, 6, 12];

// Validade senha teste
export const DATA_VALIDADE_TESTE = new Date("2026-12-31");

// Cores (tema claro)
export const CORES_FUNDO_CLARO = [
  "#B3EBF2", // cyan pastel
  "#FFF5C0", // amarelo pastel
  "#FFFFC5", // amarelo mais claro
  "#88E788", // verde pastel
  "#D3D3FF", // roxo pastel
  "#FFDBBB", // laranja pastel
];

// Tema
export const CORES_TEMA = {
  info_1_bg: "#ffee8c",
};

// Estados de bordo de cartão
export const COR_BORDA_CARTAO = {
  padrao: "#ccc",
  verde: "#4CAF50",
  amarelo: "#FFC107",
  vermelho: "#f44336",
  azul: "#2196F3",
};
