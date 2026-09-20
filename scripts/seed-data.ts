import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Função auxiliar para gerar números aleatórios
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Dados fictícios
const firstNames = [
  "Miguel", "Arthur", "Gael", "Théo", "Heitor", "Alice", "Helena", "Laura", "Manuela", "Sophia",
  "Bernardo", "Davi", "Gabriel", "Pedro", "Rafael", "Ana", "Beatriz", "Camila", "Carolina", "Fernanda",
  "Enzo", "João", "Lucas", "Matheus", "Nicolas", "Bruna", "Clara", "Gabriela", "Isabela", "Juliana",
  "Bento", "Felipe", "Guilherme", "Henrique", "Amanda", "Bianca", "Cecília", "Eloá", "Giovanna",
  "Caio", "Daniel", "Eduardo", "Fabrício", "Gustavo", "Larissa", "Letícia", "Mariana", "Natália", "Olívia"
];

const lastNames = [
  "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes",
  "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida", "Lopes", "Soares", "Fernandes", "Vieira", "Barbosa",
  "Rocha", "Dias", "Teixeira", "Machado", "Moreira", "Araújo", "Nunes", "Correia", "Mendes", "Ramos"
];

const teacherNames = [
  "Prof. Ana Paula", "Prof. Carlos Eduardo", "Prof. Mariana Souza", "Prof. Roberto Lima", "Prof. Fernanda Costa",
  "Prof. Ricardo Alves", "Prof. Juliana Martins", "Prof. Marcelo Pereira", "Prof. Patrícia Gomes", "Prof. André Ribeiro"
];

const assistantNames = [
  "Aux. Beatriz", "Aux. Daniel", "Aux. Cristiane", "Aux. Fábio", "Aux. Luciana",
  "Aux. Marcos", "Aux. Vanessa", "Aux. Bruno", "Aux. Tatiane", "Aux. Leandro"
];

function generateFullName(): string {
  const first = firstNames[randomInt(0, firstNames.length - 1)];
  const last = lastNames[randomInt(0, lastNames.length - 1)];
  return `${first} ${last}`;
}

function generateStudentCode(year: number, shift: string, classroom: string, index: number): string {
  const shiftCode = shift === 'manhã' ? 'M' : 'T';
  const yearCode = year;
  const classCode = classroom;
  const num = String(index).padStart(3, '0');
  return `${yearCode}${shiftCode}${classCode}${num}`;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function generateData() {
  console.log("🚀 Gerando dados fictícios para 500 alunos...");

  const shifts = ['manhã', 'tarde'];
  const years = [1, 2, 3, 4, 5];
  const classes = ['A', 'B', 'C', 'D', 'E'];
  
  const allStudents: any[] = [];
  const allTeachers: any[] = [];
  const allAssistants: any[] = [];

  // Criar professores (10 fixos)
  teacherNames.forEach((name, idx) => {
    allTeachers.push({
      id: idx + 1,
      nome: name,
      email: `prof${idx + 1}@escola.com.br`,
      telefone: `(11) 9${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`,
      dataCadastro: new Date().toISOString()
    });
  });

  // Criar auxiliares (10 fixos)
  assistantNames.forEach((name, idx) => {
    allAssistants.push({
      id: idx + 1,
      nome: name,
      email: `aux${idx + 1}@escola.com.br`,
      telefone: `(11) 9${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`,
      dataCadastro: new Date().toISOString()
    });
  });

  let totalStudentsGenerated = 0;
  const targetPerShift = 250;

  shifts.forEach(shift => {
    let countForShift = 0;
    const targetPerYear = targetPerShift / 5; // 50 alunos por ano neste turno

    years.forEach(year => {
      // Decidir quantas turmas esse ano terá (entre 2 e 5)
      const numClassesThisYear = randomInt(2, 5);
      const activeClasses = classes.slice(0, numClassesThisYear);
      
      let remainingForYear = targetPerYear;
      
      activeClasses.forEach((className, idx) => {
        if (countForShift >= targetPerShift) return;

        let studentsInThisClass;
        if (idx === activeClasses.length - 1) {
          studentsInThisClass = remainingForYear;
        } else {
          studentsInThisClass = Math.min(remainingForYear, randomInt(8, 12));
        }

        for (let i = 0; i < studentsInThisClass; i++) {
          if (countForShift >= targetPerShift) break;

          const name = generateFullName();
          const code = generateStudentCode(year, shift === 'manhã' ? 'M' : 'T', className, countForShift + 1);
          
          const teacherId = randomInt(1, 10);
          const assistantId = randomInt(1, 10);

          const student = {
            IDunico: generateUUID(),
            IDescolar: code,
            nome: name,
            ano: year,
            turma: className,
            turno: shift,
            professoraId: teacherId,
            auxiliarId: assistantId,
            fotoURL: null,
            dataCadastro: new Date().toISOString(),
            observacoes: `Aluno(a) do ${year}º ano, turma ${className}, período ${shift}.`
          };

          allStudents.push(student);
          countForShift++;
          totalStudentsGenerated++;
          remainingForYear--;
        }
      });
    });
    console.log(`✅ Turno ${shift}: ${countForShift} alunos gerados.`);
  });

  return {
    alunos: allStudents,
    professoras: allTeachers,
    auxiliares: allAssistants,
    mensagens: [],
    config: null
  };
}

const dados = generateData();

console.log(`\n🎉 Sucesso! Total de ${dados.alunos.length} alunos gerados.`);
console.log(`📊 Professores: ${dados.professoras.length}`);
console.log(`📊 Auxiliares: ${dados.auxiliares.length}`);

// Mostrar distribuição
console.log("\n📋 Distribuição por turno:");
const distShift: any = {};
dados.alunos.forEach((a: any) => {
  distShift[a.turno] = (distShift[a.turno] || 0) + 1;
});
console.log(distShift);

console.log("\n📋 Distribuição por ano:");
const distYear: any = {};
dados.alunos.forEach((a: any) => {
  distYear[`${a.ano}º ano`] = (distYear[`${a.ano}º ano`] || 0) + 1;
});
console.log(distYear);

// Salvar como JSON
const outputPath = join(__dirname, 'seed-data.json');
fs.writeFileSync(outputPath, JSON.stringify(dados, null, 2), 'utf-8');

console.log(`\n💾 Arquivo JSON salvo em: ${outputPath}`);
console.log("📝 Para importar: Use a função de importação do sistema Orbe Escriba.");
