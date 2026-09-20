# Projeto Orbe - PWAs Escolar Offline-First

Conjunto de 4 PWAs independentes para gestão escolar offline, comunicação via ZIP e WhatsApp.

## 🎯 Apps

### orbe-escriba (porta 5173)
**Criação de banco de dados**
- Cadastro individual de alunos
- Importação via colagem/planilha (CSV, XLS, XLSX, ODS)
- Gerenciamento de fotos e imagens institucionais
- Templates de mensagens
- Exportação em ZIP

### orbe-app (porta 5174)
**Consulta e conferência**
- Autenticação com SHA-256 (senha do dia + contra-senha)
- Busca de alunos por nome/RA
- Filtros por sala, ano, turno, professora
- Conferência com marcação (verde/amarelo)
- Importação de ZIP do escriba
- Configurações de aparência e importação

### orbe-arauto (porta 5175)
**Envio de mensagens**
- Recebe código de envio (lista de IDunicos)
- Exibe cartões com nomes e telefones
- Integração com WhatsApp
- Interface de envio de mensagens

### orbe-alvazir (porta 5176)
**Gerador de contra-senhas**
- Recebe senha do dia (8 caracteres)
- Gera 4 contra-senhas (1m, 3m, 6m, 12m)
- Validação de data
- Copia para área de transferência

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+ e npm
- Navegador moderno com suporte a IndexedDB

### Instalação
```bash
npm install
```

### Desenvolvimento
```bash
# Todos os apps em paralelo
npm run dev

# Ou individual:
npm run dev -w orbe-escriba
npm run dev -w orbe-app
npm run dev -w orbe-arauto
npm run dev -w orbe-alvazir
```

### Build
```bash
npm run build
```

### URLs em Desenvolvimento
- orbe-escriba: http://localhost:5173
- orbe-app: http://localhost:5174
- orbe-arauto: http://localhost:5175
- orbe-alvazir: http://localhost:5176

## 📋 Fluxo de Dados

```
orbe-escriba (cria ZIP)
    ↓
orbe-app (importa ZIP, autentica)
    ↓
orbe-app (marca alunos em verde/amarelo)
    ↓
código de envio via WhatsApp
    ↓
orbe-arauto (recebe código, exibe cartões)
    ↓
mensagens via WhatsApp aos responsáveis
```

## 🔐 Autenticação

**Senha do dia (8 caracteres):**
- 5 caracteres: hash do device_id
- 3 caracteres: data em base62 (desde 01/01/2026)
- Gerada automaticamente, muda a cada dia

**Contra-senhas (4 opções):**
- 1 mês: `cs_1m = SHA256(senha + "|" + SALT + "|1")`
- 3 meses: `cs_3m = SHA256(senha + "|" + SALT + "|3")`
- 6 meses: `cs_6m = SHA256(senha + "|" + SALT + "|6")`
- 12 meses: `cs_12m = SHA256(senha + "|" + SALT + "|12")`

**Senha teste:** "teste" (válida até 31/12/2026)

## 💾 Armazenamento

### IndexedDB (offline-first)
- orbe-escriba: alunos, professoras, auxiliares, mensagens, config, fotos, imagens
- orbe-app: alunos, professoras, auxiliares, mensagens, config, fotos, imagens, autenticação, conferência
- orbe-arauto: alunos, mensagens (minimal)

### localStorage
- device_id (para autenticação)
- configurações de aparência
- histórico de buscas
- filtros selecionados

## 📦 Estrutura de Pastas

```
orbe/
  compartilhado/
    src/
      tipos/
      constantes/
      algoritmo-senha/
  orbe-escriba/
    src/
      db.ts
      import-export.ts
      styles/
      main.ts
    index.html
  orbe-app/
    src/
      db.ts
      styles/
      main.ts
    index.html
  orbe-arauto/
    src/
      styles/
      main.ts
    index.html
  orbe-alvazir/
    src/
      styles/
      main.ts
    index.html
```

## 🛠️ Tecnologias

- **Vite + TypeScript**: Framework e tipagem
- **Dexie**: IndexedDB ORM
- **fflate**: Compressão ZIP
- **SheetJS**: Leitura de planilhas
- **PapaParse**: Parsing CSV/TSV
- **WebCrypto**: Hashing SHA-256
- **CSS vanilla**: Sem dependências de UI

## ✨ Características

✅ Fully offline-first  
✅ Sem backend requerido  
✅ Sem autenticação em servidor  
✅ Criptografia SHA-256 local  
✅ Integração WhatsApp  
✅ Importação/exportação ZIP  
✅ Suporta múltiplos formatos de planilha  
✅ Geração de QR code para contra-senhas  
✅ Temas claro/escuro  
✅ Responsivo para mobile  
✅ PWA installável  

## 📝 Licença

Propriedade privada - Projeto Orbe Escolar
