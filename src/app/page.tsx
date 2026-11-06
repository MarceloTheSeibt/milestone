"use client";

import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  State,
} from "ts-fsrs";

import React, { useState, useEffect } from "react";
import {
  Flame,
  Heart,
  Zap,
  Calculator,
  BookOpen,
  TrendingUp,
  Cpu,
  CheckCircle2,
  Sparkles,
  Brain,
  Check,
  Star,
  BookMarked,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signOutUser } from "@/app/login/actions";
import {
  getUserProgress,
  saveCardReview,
  incrementUserStreak,
} from "@/app/actions/progress";

type ReviewGrade = "Again" | "Hard" | "Good" | "Easy";

interface FlashcardItem {
  id: string;
  prompt: string;
  answer: string;
  explanation: string;
  options: string[];
  stability: number;
  difficulty: number;
  reps: number;
  lapses?: number;
  dueDate?: number; // Timestamp in milliseconds for the next FSRS review
  lastReviewDate?: number;
  originStepTitle?: string;
  isFsrsReview?: boolean;
  intervals: Record<ReviewGrade, string>;
}

interface MilestoneStep {
  id: string;
  title: string;
  cards: FlashcardItem[];
}

interface SubjectTrack {
  id: string;
  slug: string;
  title: string;
  unitNumber: number;
  unitTitle: string;
  description: string;
  color: string;
  bannerBg: string;
  icon: React.ReactNode;
  milestones: MilestoneStep[];
}

const GRADE_LABELS: Record<ReviewGrade, string> = {
  Again: "Errei",
  Hard: "Difícil",
  Good: "Bom",
  Easy: "Fácil",
};

const INITIAL_TRACKS: SubjectTrack[] = [
  {
    id: "sub-math",
    slug: "basic-math",
    title: "Matemática Básica",
    unitNumber: 1,
    unitTitle: "Números, funções e geometria",
    description:
      "Porcentagem, proporção, funções de 1º e 2º grau, geometria e estatística",
    color: "from-emerald-500 to-teal-600",
    bannerBg: "bg-emerald-500",
    icon: <Calculator className="w-6 h-6 text-white" />,
    milestones: [
      {
        id: "math-step-1",
        title: "Porcentagem e proporção",
        cards: [
          {
            id: "card-math-1",
            prompt:
              "Um produto que custava R$ 200,00 recebeu um desconto de 15% no pagamento à vista. Qual passou a ser o valor final do produto?",
            answer: "R$ 170,00",
            explanation:
              "15% de R$ 200,00 equivale a 0,15 × 200 = R$ 30,00 de desconto. Subtraindo do valor original: 200 - 30 = R$ 170,00.",
            options: ["R$ 185,00", "R$ 170,00", "R$ 165,00", "R$ 150,00"],
            stability: 2.4,
            difficulty: 3.5,
            reps: 2,
            intervals: { Again: "1m", Hard: "2d", Good: "6d", Easy: "14d" },
          },
          {
            id: "card-math-2",
            prompt:
              "Se uma impressora imprime 120 páginas em 4 minutos mantendo velocidade constante, quantas páginas ela imprimirá em 10 minutos?",
            answer: "300 páginas",
            explanation:
              "Por regra de três direta: em 1 minuto a impressora produz 120 ÷ 4 = 30 páginas. Logo, em 10 minutos ela imprimirá 30 × 10 = 300 páginas.",
            options: [
              "240 páginas",
              "280 páginas",
              "300 páginas",
              "480 páginas",
            ],
            stability: 2.8,
            difficulty: 3.2,
            reps: 2,
            intervals: { Again: "1m", Hard: "2d", Good: "7d", Easy: "15d" },
          },
          {
            id: "card-math-3",
            prompt:
              "Em uma sala com 40 alunos, 25% usam óculos. Quantos alunos dessa sala NÃO usam óculos?",
            answer: "30 alunos",
            explanation:
              "25% de 40 equivale a 10 alunos que usam óculos. Portanto, 40 - 10 = 30 alunos não usam óculos (75% do total).",
            options: ["10 alunos", "20 alunos", "25 alunos", "30 alunos"],
            stability: 2.5,
            difficulty: 3.1,
            reps: 2,
            intervals: { Again: "1m", Hard: "2d", Good: "6d", Easy: "14d" },
          },
        ],
      },
      {
        id: "math-step-2",
        title: "Funções e equações",
        cards: [
          {
            id: "card-math-4",
            prompt:
              "Dada a função do 1º grau f(x) = 2x - 8, qual é a raiz (ou zero) dessa função?",
            answer: "x = 4",
            explanation:
              "A raiz da função é o valor de x para o qual f(x) = 0. Resolvendo 2x - 8 = 0, temos 2x = 8 e, portanto, x = 4.",
            options: ["x = -8", "x = 2", "x = 4", "x = 16"],
            stability: 1.8,
            difficulty: 3.8,
            reps: 1,
            intervals: { Again: "1m", Hard: "1d", Good: "4d", Easy: "10d" },
          },
          {
            id: "card-math-5",
            prompt:
              "Em uma equação do 2º grau (ax² + bx + c = 0), o que ocorre com as raízes reais quando o discriminante (Δ = b² - 4ac) é igual a zero?",
            answer:
              "A equação possui duas raízes reais e iguais (uma única solução real).",
            explanation:
              "Quando Δ > 0 há duas raízes reais distintas; quando Δ = 0 as duas raízes são reais e iguais; e quando Δ < 0 não existem raízes reais.",
            options: [
              "A equação não possui nenhuma raiz real.",
              "A equação possui duas raízes reais e iguais (uma única solução real).",
              "A equação possui duas raízes reais opostas.",
              "O gráfico da parábola não encosta no eixo x.",
            ],
            stability: 2.1,
            difficulty: 4.2,
            reps: 2,
            intervals: { Again: "1m", Hard: "2d", Good: "5d", Easy: "12d" },
          },
          {
            id: "card-math-6",
            prompt: "Qual é o valor de x na equação do 1º grau 3x + 5 = 20?",
            answer: "x = 5",
            explanation:
              "Subtraindo 5 dos dois lados, temos 3x = 15. Dividindo ambos os lados por 3, obtemos x = 15 ÷ 3 = 5.",
            options: ["x = 3", "x = 5", "x = 7", "x = 15"],
            stability: 3.0,
            difficulty: 2.9,
            reps: 3,
            intervals: { Again: "1m", Hard: "3d", Good: "8d", Easy: "17d" },
          },
        ],
      },
      {
        id: "math-step-3",
        title: "Geometria e estatística",
        cards: [
          {
            id: "card-math-7",
            prompt:
              "Em um triângulo retângulo cujos catetos medem 3 cm e 4 cm, qual é a medida da hipotenusa?",
            answer: "5 cm",
            explanation:
              "Pelo Teorema de Pitágoras (a² = b² + c²), temos a² = 3² + 4² = 9 + 16 = 25. Extraindo a raiz quadrada, a = √25 = 5 cm.",
            options: ["5 cm", "6 cm", "7 cm", "12 cm"],
            stability: 3.2,
            difficulty: 3.0,
            reps: 3,
            intervals: { Again: "1m", Hard: "3d", Good: "8d", Easy: "18d" },
          },
          {
            id: "card-math-8",
            prompt:
              "Um estudante obteve as notas 6,0, 7,5 e 10,5 em três avaliações. Qual foi a sua média aritmética simples?",
            answer: "8,0",
            explanation:
              "A média aritmética simples é a soma dos valores dividida pela quantidade de termos: (6,0 + 7,5 + 10,5) ÷ 3 = 24 ÷ 3 = 8,0.",
            options: ["7,5", "8,0", "8,5", "9,0"],
            stability: 3.0,
            difficulty: 3.1,
            reps: 2,
            intervals: { Again: "1m", Hard: "3d", Good: "7d", Easy: "16d" },
          },
          {
            id: "card-math-9",
            prompt:
              "Qual é a área de um terreno retangular que mede 12 metros de comprimento por 5 metros de largura?",
            answer: "60 m²",
            explanation:
              "A área de um retângulo é calculada multiplicando a base pela altura (comprimento × largura): 12 m × 5 m = 60 m².",
            options: ["17 m²", "34 m²", "60 m²", "120 m²"],
            stability: 3.4,
            difficulty: 2.8,
            reps: 3,
            intervals: { Again: "1m", Hard: "4d", Good: "9d", Easy: "20d" },
          },
        ],
      },
      {
        id: "math-step-4",
        title: "Frações e potências",
        cards: [
          {
            id: "card-math-10",
            prompt: "Qual é o resultado da soma das frações 1/2 + 1/4?",
            answer: "3/4",
            explanation:
              "Igualando os denominadores (MMC entre 2 e 4 é 4), convertemos 1/2 para 2/4. Somando os numeradores: 2/4 + 1/4 = 3/4.",
            options: ["2/6", "1/6", "3/4", "2/4"],
            stability: 2.6,
            difficulty: 3.2,
            reps: 2,
            intervals: { Again: "1m", Hard: "2d", Good: "6d", Easy: "14d" },
          },
          {
            id: "card-math-11",
            prompt:
              "Pelas propriedades da potenciação, qual é o valor de 2³ × 2²?",
            answer: "32 (ou 2⁵)",
            explanation:
              "Na multiplicação de potências de mesma base, conservamos a base e somamos os expoentes: 2^(3+2) = 2⁵ = 32.",
            options: ["16 (ou 2⁴)", "32 (ou 2⁵)", "64 (ou 2⁶)", "10"],
            stability: 2.9,
            difficulty: 3.0,
            reps: 2,
            intervals: { Again: "1m", Hard: "3d", Good: "7d", Easy: "15d" },
          },
          {
            id: "card-math-12",
            prompt: "Qual é o valor da expressão √81 + 5⁰?",
            answer: "10",
            explanation:
              "A raiz quadrada de 81 é 9, e todo número diferente de zero elevado ao expoente 0 é igual a 1. Logo, 9 + 1 = 10.",
            options: ["9", "10", "14", "86"],
            stability: 3.1,
            difficulty: 2.8,
            reps: 3,
            intervals: { Again: "1m", Hard: "3d", Good: "8d", Easy: "18d" },
          },
        ],
      },
      {
        id: "math-step-5",
        title: "Probabilidade e contagem",
        cards: [
          {
            id: "card-math-13",
            prompt:
              "Ao lançar um dado comum de 6 faces, qual é a probabilidade de sair um número par?",
            answer: "50% (ou 3/6)",
            explanation:
              "Existem 3 números pares (2, 4 e 6) em um total de 6 resultados possíveis. A razão 3/6 simplificada equivale a 1/2 ou 50%.",
            options: [
              "16,6% (ou 1/6)",
              "33,3% (ou 2/6)",
              "50% (ou 3/6)",
              "66,6% (ou 4/6)",
            ],
            stability: 3.3,
            difficulty: 2.7,
            reps: 3,
            intervals: { Again: "1m", Hard: "4d", Good: "9d", Easy: "19d" },
          },
          {
            id: "card-math-14",
            prompt:
              "Uma pessoa possui 3 camisetas diferentes e 4 calças diferentes. De quantas maneiras distintas ela pode escolher uma camiseta e uma calça?",
            answer: "12 combinações",
            explanation:
              "Pelo Princípio Fundamental da Contagem (princípio multiplicativo), multiplicamos as opções de cada etapa: 3 × 4 = 12.",
            options: [
              "7 combinações",
              "9 combinações",
              "12 combinações",
              "16 combinações",
            ],
            stability: 3.0,
            difficulty: 2.9,
            reps: 2,
            intervals: { Again: "1m", Hard: "3d", Good: "7d", Easy: "16d" },
          },
          {
            id: "card-math-15",
            prompt:
              "Uma urna contém 3 bolas azuis e 7 bolas brancas. Ao retirar uma bola ao acaso, qual é a chance de ela ser azul?",
            answer: "30% (ou 3/10)",
            explanation:
              "O total de bolas na urna é 3 + 7 = 10. Como 3 são azuis, a probabilidade é de 3 em 10 (3/10 = 0,30 = 30%).",
            options: [
              "20% (ou 2/10)",
              "30% (ou 3/10)",
              "42% (ou 3/7)",
              "70% (ou 7/10)",
            ],
            stability: 2.8,
            difficulty: 3.1,
            reps: 2,
            intervals: { Again: "1m", Hard: "3d", Good: "7d", Easy: "15d" },
          },
        ],
      },
      {
        id: "math-step-6",
        title: "Sequências e medidas",
        cards: [
          {
            id: "card-math-16",
            prompt:
              "Qual é o próximo termo da Progressão Aritmética (PA): (2, 5, 8, 11, ...)?",
            answer: "14",
            explanation:
              "Em uma PA, a diferença (razão) entre termos consecutivos é constante. Aqui a razão é +3, portanto 11 + 3 = 14.",
            options: ["13", "14", "15", "22"],
            stability: 3.4,
            difficulty: 2.6,
            reps: 3,
            intervals: { Again: "1m", Hard: "4d", Good: "9d", Easy: "20d" },
          },
          {
            id: "card-math-17",
            prompt:
              "Qual é o próximo termo da Progressão Geométrica (PG): (3, 6, 12, 24, ...)?",
            answer: "48",
            explanation:
              "Em uma PG, cada termo é obtido multiplicando o anterior por uma razão constante. Aqui a razão é 2, logo 24 × 2 = 48.",
            options: ["30", "36", "48", "72"],
            stability: 3.2,
            difficulty: 2.8,
            reps: 3,
            intervals: { Again: "1m", Hard: "3d", Good: "8d", Easy: "18d" },
          },
          {
            id: "card-math-18",
            prompt: "Qual é o perímetro de um quadrado cujo lado mede 7 cm?",
            answer: "28 cm",
            explanation:
              "O perímetro é a soma das medidas de todos os lados da figura. Como o quadrado tem 4 lados iguais: 4 × 7 cm = 28 cm.",
            options: ["14 cm", "21 cm", "28 cm", "49 cm"],
            stability: 3.5,
            difficulty: 2.5,
            reps: 3,
            intervals: { Again: "1m", Hard: "4d", Good: "10d", Easy: "21d" },
          },
        ],
      },
    ],
  },
  {
    id: "sub-port",
    slug: "portuguese-language",
    title: "Língua Portuguesa e Redação Acadêmica",
    unitNumber: 1,
    unitTitle: "Gramática, ortografia e coesão",
    description: "Coesão, sintaxe formal, crase e escrita científica",
    color: "from-blue-500 to-indigo-600",
    bannerBg: "bg-blue-600",
    icon: <BookOpen className="w-6 h-6 text-white" />,
    milestones: [
      {
        id: "port-step-1",
        title: "Crase e concordância",
        cards: [
          {
            id: "card-port-1",
            prompt:
              "Quando ocorre o fenômeno da crase (à) na norma-padrão da Língua Portuguesa?",
            answer:
              "Na fusão da preposição 'a' com o artigo definido feminino 'a' ou pronomes demonstrativos iniciados por 'a'.",
            explanation:
              "A crase exige que o termo regente peça a preposição 'a' e o termo regido aceite o artigo feminino 'a'.",
            options: [
              "Antes de qualquer verbo no infinitivo impessoal",
              "Na fusão da preposição 'a' com o artigo definido feminino 'a' ou pronomes demonstrativos iniciados por 'a'.",
              "Antes de substantivos masculinos no plural em textos acadêmicos",
              "Sempre que uma oração inicia com locução adverbial",
            ],
            stability: 3.1,
            difficulty: 4.8,
            reps: 3,
            intervals: { Again: "5m", Hard: "4d", Good: "9d", Easy: "21d" },
          },
          {
            id: "card-port-2",
            prompt:
              "Na frase 'Fazem dois anos que o artigo foi publicado', qual é o desvio gramatical presente?",
            answer:
              "O verbo 'fazer' indicando tempo decorrido é impessoal e deve permanecer na 3ª pessoa do singular ('Faz dois anos').",
            explanation:
              "Verbos impessoais (como 'fazer' indicando tempo decorrido e 'haver' no sentido de existir) não possuem sujeito e não vão para o plural.",
            options: [
              "O verbo 'publicar' deveria estar no subjuntivo",
              "O verbo 'fazer' indicando tempo decorrido é impessoal e deve permanecer na 3ª pessoa do singular ('Faz dois anos').",
              "Falta uma vírgula obrigatória após a palavra 'anos'",
              "O pronome relativo 'que' deveria ser substituído por 'cujo'",
            ],
            stability: 2.5,
            difficulty: 3.9,
            reps: 2,
            intervals: { Again: "1m", Hard: "2d", Good: "6d", Easy: "14d" },
          },
          {
            id: "card-port-3",
            prompt:
              "Qual alternativa apresenta a concordância correta do verbo 'haver' no sentido de 'existir'?",
            answer: "Havia muitas dúvidas sobre o tema da aula.",
            explanation:
              "O verbo 'haver' com sentido de existir é impessoal e permanece sempre na 3ª pessoa do singular, mesmo acompanhado de termos no plural.",
            options: [
              "Haviam muitas dúvidas sobre o tema da aula.",
              "Havia muitas dúvidas sobre o tema da aula.",
              "Houveram várias reuniões ontem à tarde.",
              "Devem haver outras soluções possíveis.",
            ],
            stability: 2.7,
            difficulty: 3.5,
            reps: 2,
            intervals: { Again: "1m", Hard: "2d", Good: "6d", Easy: "15d" },
          },
        ],
      },
      {
        id: "port-step-2",
        title: "Ortografia e sentido",
        cards: [
          {
            id: "card-port-4",
            prompt:
              "Qual das alternativas preenche corretamente a frase: 'Não fui à aula ontem ______ estava chovendo muito'?",
            answer: "porque (junto e sem acento)",
            explanation:
              "Usa-se 'porque' (junto e sem acento) em respostas e explicações/causas. 'Por que' (separado) é usado no início de perguntas.",
            options: [
              "por que (separado e sem acento)",
              "porque (junto e sem acento)",
              "por quê (separado e com acento)",
              "porquê (junto e com acento)",
            ],
            stability: 2.9,
            difficulty: 3.4,
            reps: 2,
            intervals: { Again: "1m", Hard: "3d", Good: "7d", Easy: "15d" },
          },
          {
            id: "card-port-5",
            prompt:
              "Qual é a diferença correta entre o uso de 'mas' e 'mais' na Língua Portuguesa?",
            answer:
              "'Mas' indica oposição (equivalente a 'porém'), enquanto 'mais' indica adição ou intensidade.",
            explanation:
              "Exemplo: 'Estudou bastante, mas (porém) ficou nervoso' vs. 'Preciso de mais (quantidade) tempo para terminar a redação'.",
            options: [
              "'Mas' indica adição e 'mais' indica oposição.",
              "'Mas' indica oposição (equivalente a 'porém'), enquanto 'mais' indica adição ou intensidade.",
              "Ambos têm o mesmo significado e podem ser usados como sinônimos.",
              "'Mais' só pode ser utilizado no final de frases interrogativas.",
            ],
            stability: 3.5,
            difficulty: 2.8,
            reps: 3,
            intervals: { Again: "5m", Hard: "4d", Good: "10d", Easy: "22d" },
          },
          {
            id: "card-port-6",
            prompt:
              "Qual frase apresenta o uso correto dos termos 'mal' (oposto de bem) e 'mau' (oposto de bom)?",
            answer: "Ele passou mal após o almoço, mas não é um mau estudante.",
            explanation:
              "'Mal' com L é advérbio (oposto de 'bem') e 'mau' com U é adjetivo (oposto de 'bom').",
            options: [
              "Ele passou mau após o almoço, mas não é um mal estudante.",
              "Ele passou mal após o almoço, mas não é um mau estudante.",
              "Ambas as palavras devem ser escritas apenas com a letra L.",
              "'Mau' só pode ser usado antes de verbos no infinitivo.",
            ],
            stability: 3.0,
            difficulty: 3.1,
            reps: 2,
            intervals: { Again: "1m", Hard: "3d", Good: "7d", Easy: "16d" },
          },
        ],
      },
      {
        id: "port-step-3",
        title: "Coesão e conectivos",
        cards: [
          {
            id: "card-port-7",
            prompt:
              "Em uma redação, conectivos como 'portanto', 'logo' e 'por conseguinte' são utilizados para introduzir uma ideia de:",
            answer: "Conclusão",
            explanation:
              "Conectivos conclusivos fecham um raciocínio lógico apresentado anteriormente, sendo muito usados no último parágrafo de textos dissertativos.",
            options: [
              "Oposição ou contraste",
              "Conclusão",
              "Comparação",
              "Dúvida ou hipótese",
            ],
            stability: 2.7,
            difficulty: 3.2,
            reps: 2,
            intervals: { Again: "1m", Hard: "2d", Good: "6d", Easy: "14d" },
          },
          {
            id: "card-port-8",
            prompt:
              "Qual frase apresenta o uso correto de 'onde' e 'aonde' de acordo com a norma-padrão?",
            answer:
              "'A biblioteca onde estudo é silenciosa' e 'Aonde você vai com tanta pressa?'",
            explanation:
              "Usa-se 'onde' para indicar lugar fixo (permanência) e 'aonde' com verbos que indicam movimento para algum lugar (quem vai, vai a algum lugar).",
            options: [
              "'Aonde você mora atualmente?' e 'Onde você vai agora?'",
              "'A biblioteca onde estudo é silenciosa' e 'Aonde você vai com tanta pressa?'",
              "'Onde' só pode ser usado para tempo e 'aonde' para espaço.",
              "Ambas as palavras estão em desuso na escrita formal.",
            ],
            stability: 2.2,
            difficulty: 4.1,
            reps: 2,
            intervals: { Again: "1m", Hard: "2d", Good: "5d", Easy: "12d" },
          },
          {
            id: "card-port-9",
            prompt:
              "As conjunções 'contudo', 'todavia' e 'entretanto' expressam qual relação de sentido em um texto?",
            answer: "Oposição ou ressalva (adversidade)",
            explanation:
              "Esses conectivos têm o mesmo valor de 'mas' e 'porém', servindo para contrastar argumentos na redação.",
            options: [
              "Causa e consequência",
              "Oposição ou ressalva (adversidade)",
              "Explicação ou justificativa",
              "Proporcionalidade temporal",
            ],
            stability: 2.8,
            difficulty: 3.3,
            reps: 2,
            intervals: { Again: "1m", Hard: "3d", Good: "7d", Easy: "15d" },
          },
        ],
      },
      {
        id: "port-step-4",
        title: "Pontuação e vírgula",
        cards: [
          {
            id: "card-port-10",
            prompt:
              "Qual é a regra fundamental sobre o uso da vírgula entre o sujeito e o verbo (predicado) na ordem direta?",
            answer: "Nunca se deve separar o sujeito do verbo com vírgula.",
            explanation:
              "Na estrutura direta (Sujeito + Verbo + Complemento), inserir uma vírgula entre o sujeito e o verbo é um erro gramatical grave.",
            options: [
              "Sempre se usa vírgula quando o sujeito é muito longo.",
              "Nunca se deve separar o sujeito do verbo com vírgula.",
              "A vírgula é obrigatória quando o sujeito está no plural.",
              "O uso da vírgula depende apenas da respiração do leitor.",
            ],
            stability: 2.9,
            difficulty: 3.1,
            reps: 2,
            intervals: { Again: "1m", Hard: "3d", Good: "7d", Easy: "16d" },
          },
          {
            id: "card-port-11",
            prompt:
              "Na frase 'Machado de Assis, grande escritor brasileiro, fundou a Academia Brasileira de Letras', por que o trecho destacado está entre vírgulas?",
            answer: "Porque funciona como um aposto explicativo.",
            explanation:
              "O aposto explicativo adiciona uma informação acessória sobre o termo anterior ('Machado de Assis') e deve ficar isolado por vírgulas.",
            options: [
              "Porque é o sujeito principal da oração.",
              "Porque funciona como um aposto explicativo.",
              "Porque indica uma pergunta indireta.",
              "Porque separa dois verbos no passado.",
            ],
            stability: 2.6,
            difficulty: 3.5,
            reps: 2,
            intervals: { Again: "1m", Hard: "2d", Good: "6d", Easy: "14d" },
          },
          {
            id: "card-port-12",
            prompt:
              "Para que servem os dois-pontos (:) na construção de um parágrafo acadêmico ou redação?",
            answer:
              "Para introduzir uma citação, uma enumeração ou um esclarecimento do que foi dito antes.",
            explanation:
              "Os dois-pontos anunciam que o trecho seguinte explicará, exemplificará ou citará diretamente a ideia recém-apresentada.",
            options: [
              "Para encerrar definitivamente um parágrafo sem continuação.",
              "Para introduzir uma citação, uma enumeração ou um esclarecimento do que foi dito antes.",
              "Para substituir o ponto de interrogação em perguntas diretas.",
              "Para separar as sílabas de uma palavra no fim da linha.",
            ],
            stability: 3.1,
            difficulty: 2.9,
            reps: 3,
            intervals: { Again: "1m", Hard: "3d", Good: "8d", Easy: "18d" },
          },
        ],
      },
      {
        id: "port-step-5",
        title: "Figuras de linguagem",
        cards: [
          {
            id: "card-port-13",
            prompt:
              "Qual figura de linguagem ocorre na frase 'Aquele atleta é um foguete na pista', em que há uma comparação implícita sem conectivo?",
            answer: "Metáfora",
            explanation:
              "A metáfora transfere o sentido de uma palavra ('foguete' = rapidez) para outra sem utilizar conectivos comparativos como 'igual a' ou 'como'.",
            options: ["Eufemismo", "Metáfora", "Pleonasmo", "Antítese"],
            stability: 3.2,
            difficulty: 2.8,
            reps: 3,
            intervals: { Again: "1m", Hard: "3d", Good: "8d", Easy: "18d" },
          },
          {
            id: "card-port-14",
            prompt:
              "Quando alguém diz 'Já lhe falei um milhão de vezes para revisar o texto!', qual figura de linguagem está sendo usada para exagerar a ideia?",
            answer: "Hipérbole",
            explanation:
              "A hipérbole consiste no exagero intencional de uma expressão para dar maior ênfase ao que se deseja comunicar.",
            options: ["Ironia", "Hipérbole", "Prosopopeia", "Sinestesia"],
            stability: 3.4,
            difficulty: 2.7,
            reps: 3,
            intervals: { Again: "1m", Hard: "4d", Good: "9d", Easy: "20d" },
          },
          {
            id: "card-port-15",
            prompt:
              "O uso de pares de palavras com sentidos opostos na mesma frase, como em 'O amor é fogo que arde sem se ver; é ferida que dói e não se sente', caracteriza:",
            answer: "Antítese e Paradoxo",
            explanation:
              "A aproximação de termos opostos cria contraste (antítese) e ideias aparentemente contraditórias que revelam uma verdade profunda (paradoxo).",
            options: [
              "Onomatopeia",
              "Antítese e Paradoxo",
              "Catacrese",
              "Elipse",
            ],
            stability: 2.7,
            difficulty: 3.4,
            reps: 2,
            intervals: { Again: "1m", Hard: "2d", Good: "6d", Easy: "14d" },
          },
        ],
      },
      {
        id: "port-step-6",
        title: "Tipologia e argumentação",
        cards: [
          {
            id: "card-port-16",
            prompt:
              "Qual é o objetivo central de um texto do tipo Dissertativo-Argumentativo (como a redação do ENEM)?",
            answer:
              "Defender um ponto de vista (tese) sobre um tema por meio de argumentos coerentes e fatos.",
            explanation:
              "Diferente do texto narrativo (que conta uma história), o texto dissertativo-argumentativo analisa um problema e busca convencer o leitor com base em evidências.",
            options: [
              "Contar uma história ficcional com personagens e enredo.",
              "Defender um ponto de vista (tese) sobre um tema por meio de argumentos coerentes e fatos.",
              "Apenas listar instruções técnicas de montagem de um aparelho.",
              "Descrever detalhadamente uma paisagem sem emitir opinião.",
            ],
            stability: 3.3,
            difficulty: 2.8,
            reps: 3,
            intervals: { Again: "1m", Hard: "4d", Good: "9d", Easy: "19d" },
          },
          {
            id: "card-port-17",
            prompt:
              "Em um texto acadêmico ou jornalístico, o que significa usar uma 'Citação Direta'?",
            answer:
              "Transcrever exatamente as palavras de outro autor, destacando o trecho entre aspas e informando a fonte.",
            explanation:
              "A citação direta reproduz fielmente o texto original; já na citação indireta (paráfrase), reescrevemos a ideia do autor com nossas próprias palavras.",
            options: [
              "Inventar dados estatísticos sem mencionar o autor.",
              "Transcrever exatamente as palavras de outro autor, destacando o trecho entre aspas e informando a fonte.",
              "Resumir um livro inteiro sem colocar o nome do escritor.",
              "Escrever um parágrafo usando apenas linguagem informal.",
            ],
            stability: 3.0,
            difficulty: 3.0,
            reps: 2,
            intervals: { Again: "1m", Hard: "3d", Good: "7d", Easy: "16d" },
          },
          {
            id: "card-port-18",
            prompt:
              "O que significa dizer que um texto possui 'Coerência Textual'?",
            answer:
              "Que as ideias do texto fazem sentido juntas, sem contradições lógicas entre os parágrafos.",
            explanation:
              "Enquanto a coesão cuida da ligação gramatical (conectivos), a coerência garante a harmonia e a lógica global das informações apresentadas.",
            options: [
              "Que o texto usa palavras difíceis, mesmo sem fazer sentido.",
              "Que as ideias do texto fazem sentido juntas, sem contradições lógicas entre os parágrafos.",
              "Que todas as frases do texto rimam umas com as outras.",
              "Que o texto foi escrito sem usar nenhum verbo.",
            ],
            stability: 3.2,
            difficulty: 2.9,
            reps: 3,
            intervals: { Again: "1m", Hard: "3d", Good: "8d", Easy: "18d" },
          },
        ],
      },
    ],
  },
  {
    id: "sub-econ",
    slug: "basic-economics",
    title: "Economia Básica",
    unitNumber: 1,
    unitTitle: "Mercados, moeda e finanças",
    description:
      "Custo de oportunidade, inflação, oferta e demanda e educação financeira",
    color: "from-amber-500 to-orange-600",
    bannerBg: "bg-amber-500",
    icon: <TrendingUp className="w-6 h-6 text-white" />,
    milestones: [
      {
        id: "econ-step-1",
        title: "Escassez e mercados",
        cards: [
          {
            id: "card-econ-1",
            prompt:
              "O que significa o conceito de 'Custo de Oportunidade' na tomada de decisão econômica?",
            answer:
              "O valor da melhor alternativa renunciada ao se fazer uma escolha.",
            explanation:
              "Como os recursos são escassos, toda decisão envolve abrir mão dos benefícios da melhor opção alternativa que não foi escolhida.",
            options: [
              "O custo irrecuperável já pago em investimentos passados",
              "O valor da melhor alternativa renunciada ao se fazer uma escolha.",
              "A alíquota tributária incidente sobre o lucro líquido operacional",
              "O custo marginal de produzir uma unidade adicional de um bem",
            ],
            stability: 1.8,
            difficulty: 4.5,
            reps: 1,
            intervals: { Again: "1m", Hard: "2d", Good: "5d", Easy: "11d" },
          },
          {
            id: "card-econ-2",
            prompt:
              "Segundo a Lei da Oferta e da Demanda, o que costuma acontecer quando um produto fica escasso no mercado, mas muitas pessoas querem comprá-lo?",
            answer: "O preço desse produto tende a subir.",
            explanation:
              "Quando a procura (demanda) é maior que a quantidade disponível (oferta), os preços sobem até atingir um novo equilíbrio.",
            options: [
              "O preço desse produto tende a cair rapidamente.",
              "O preço desse produto tende a subir.",
              "O produto passa a ser distribuído gratuitamente.",
              "A oferta aumenta instantaneamente sem custo adicional.",
            ],
            stability: 2.9,
            difficulty: 3.1,
            reps: 2,
            intervals: { Again: "1m", Hard: "3d", Good: "7d", Easy: "16d" },
          },
          {
            id: "card-econ-3",
            prompt:
              "Como é chamado o mercado em que existe apenas uma única empresa vendendo determinado produto ou serviço, sem concorrentes diretos?",
            answer: "Monopólio",
            explanation:
              "No monopólio, um único fornecedor domina toda a oferta de um bem ou serviço, tendo forte controle sobre os preços praticados.",
            options: [
              "Concorrência perfeita",
              "Monopólio",
              "Cooperativa de crédito",
              "Pregão eletrônico",
            ],
            stability: 3.1,
            difficulty: 2.9,
            reps: 2,
            intervals: { Again: "1m", Hard: "3d", Good: "8d", Easy: "17d" },
          },
        ],
      },
      {
        id: "econ-step-2",
        title: "Inflação e indicadores",
        cards: [
          {
            id: "card-econ-4",
            prompt:
              "O que é a inflação e qual é o seu efeito direto no bolso do consumidor?",
            answer:
              "É o aumento generalizado e contínuo dos preços, que reduz o poder de compra do dinheiro.",
            explanation:
              "Com a inflação, uma mesma nota de R$ 100,00 passa a comprar menos produtos no supermercado do que comprava no ano anterior.",
            options: [
              "É a queda de preços que aumenta o poder de compra do salário.",
              "É o aumento generalizado e contínuo dos preços, que reduz o poder de compra do dinheiro.",
              "É um imposto cobrado exclusivamente sobre produtos importados.",
              "É o lucro líquido obtido pelos bancos em operações de câmbio.",
            ],
            stability: 3.0,
            difficulty: 3.2,
            reps: 2,
            intervals: { Again: "1m", Hard: "3d", Good: "8d", Easy: "17d" },
          },
          {
            id: "card-econ-5",
            prompt: "O que mede o PIB (Produto Interno Bruto) de um país?",
            answer:
              "A soma de todos os bens e serviços finais produzidos dentro do país durante um determinado período.",
            explanation:
              "O PIB é o principal termômetro para saber se a atividade econômica de um país está crescendo ou encolhendo de um ano para o outro.",
            options: [
              "Apenas a quantidade de dinheiro guardada no Banco Central.",
              "A soma de todos os bens e serviços finais produzidos dentro do país durante um determinado período.",
              "O total de impostos arrecadados pelas prefeituras municipais.",
              "Apenas o valor das exportações de produtos agrícolas.",
            ],
            stability: 2.6,
            difficulty: 3.6,
            reps: 2,
            intervals: { Again: "1m", Hard: "2d", Good: "6d", Easy: "14d" },
          },
          {
            id: "card-econ-6",
            prompt:
              "No Brasil, qual é o papel principal da Taxa Selic definida pelo Banco Central?",
            answer:
              "Servir como a taxa básica de juros da economia, influenciando todas as demais taxas de crédito, financiamentos e investimentos.",
            explanation:
              "O Banco Central ajusta a Selic para controlar a inflação: quando a Selic sobe, o crédito encarece e o consumo desacelera.",
            options: [
              "Fixar o preço oficial do litro da gasolina nos postos.",
              "Servir como a taxa básica de juros da economia, influenciando todas as demais taxas de crédito, financiamentos e investimentos.",
              "Determinar o valor exato do salário mínimo estadual.",
              "Substituir o uso de moedas metálicas pelo pagamento via cartão.",
            ],
            stability: 2.5,
            difficulty: 3.7,
            reps: 2,
            intervals: { Again: "1m", Hard: "2d", Good: "6d", Easy: "14d" },
          },
        ],
      },
      {
        id: "econ-step-3",
        title: "Educação financeira",
        cards: [
          {
            id: "card-econ-7",
            prompt:
              "Qual é a principal diferença entre Juros Simples e Juros Compostos?",
            answer:
              "Nos juros simples a taxa incide apenas sobre o valor inicial; nos compostos, incide sobre o valor inicial somado aos juros já acumulados.",
            explanation:
              "Os juros compostos são chamados de 'juros sobre juros', fazendo com que dívidas ou investimentos cresçam de forma exponencial ao longo do tempo.",
            options: [
              "Juros simples são cobrados ao mês e juros compostos apenas ao ano.",
              "Nos juros simples a taxa incide apenas sobre o valor inicial; nos compostos, incide sobre o valor inicial somado aos juros já acumulados.",
              "Juros compostos sempre resultam em valores menores que os juros simples.",
              "Não há diferença matemática entre os dois, apenas mudança de nome.",
            ],
            stability: 2.3,
            difficulty: 3.9,
            reps: 2,
            intervals: { Again: "1m", Hard: "2d", Good: "6d", Easy: "13d" },
          },
          {
            id: "card-econ-8",
            prompt:
              "No orçamento pessoal ou familiar, qual é a diferença entre despesas fixas e despesas variáveis?",
            answer:
              "Despesas fixas têm valor constante todo mês (ex: aluguel), enquanto as variáveis mudam conforme o consumo (ex: lazer, alimentação fora).",
            explanation:
              "Conhecer essa diferença ajuda no planejamento financeiro, pois é mais fácil reduzir gastos no curto prazo ajustando as despesas variáveis.",
            options: [
              "Despesas fixas são opcionais e despesas variáveis são obrigatórias.",
              "Despesas fixas têm valor constante todo mês (ex: aluguel), enquanto as variáveis mudam conforme o consumo (ex: lazer, alimentação fora).",
              "Despesas variáveis só ocorrem uma vez a cada cinco anos.",
              "Despesas fixas não precisam ser pagas em meses de férias.",
            ],
            stability: 3.4,
            difficulty: 2.9,
            reps: 3,
            intervals: { Again: "5m", Hard: "4d", Good: "9d", Easy: "20d" },
          },
          {
            id: "card-econ-9",
            prompt:
              "Para que serve uma 'Reserva de Emergência' no planejamento financeiro pessoal?",
            answer:
              "Para cobrir imprevistos financeiros (como problemas de saúde ou perda de renda) sem precisar recorrer a empréstimos com juros altos.",
            explanation:
              "Recomenda-se manter entre 3 e 6 meses do custo de vida guardados em uma aplicação segura e de resgate imediato (liquidez diária).",
            options: [
              "Para comprar ações de alto risco na bolsa de valores.",
              "Para cobrir imprevistos financeiros (como problemas de saúde ou perda de renda) sem precisar recorrer a empréstimos com juros altos.",
              "Para pagar impostos atrasados de empresas multinacionais.",
              "Para bloquear o uso do cartão de débito em compras presenciais.",
            ],
            stability: 3.2,
            difficulty: 2.8,
            reps: 3,
            intervals: { Again: "5m", Hard: "4d", Good: "9d", Easy: "19d" },
          },
        ],
      },
      {
        id: "econ-step-4",
        title: "Impostos e orçamento público",
        cards: [
          {
            id: "card-econ-10",
            prompt:
              "Para que servem os impostos e tributos arrecadados pelo Estado (Governo Federal, Estados e Municípios)?",
            answer:
              "Para financiar serviços e investimentos públicos, como saúde, educação, segurança e infraestrutura.",
            explanation:
              "O orçamento público depende da arrecadação tributária para manter hospitais, escolas, estradas e programas sociais funcionando.",
            options: [
              "Apenas para guardar moedas em cofres privados no exterior.",
              "Para financiar serviços e investimentos públicos, como saúde, educação, segurança e infraestrutura.",
              "Para substituir o salário pago pelas empresas privadas.",
              "Exclusivamente para cobrir tarifas de cartões de crédito.",
            ],
            stability: 3.3,
            difficulty: 2.7,
            reps: 3,
            intervals: { Again: "1m", Hard: "4d", Good: "9d", Easy: "19d" },
          },
          {
            id: "card-econ-11",
            prompt:
              "Qual é a diferença entre um imposto direto (como o Imposto de Renda) e um imposto indireto (embutido no consumo)?",
            answer:
              "O direto incide sobre a renda ou patrimônio da pessoa; o indireto está embutido no preço de produtos e serviços.",
            explanation:
              "Impostos indiretos cobrados sobre mercadorias são pagos por todos os consumidores no momento da compra, independentemente da renda.",
            options: [
              "Impostos indiretos são opcionais para o consumidor no caixa.",
              "O direto incide sobre a renda ou patrimônio da pessoa; o indireto está embutido no preço de produtos e serviços.",
              "O imposto direto só é cobrado em compras internacionais.",
              "Não existe cobrança de impostos sobre produtos no Brasil.",
            ],
            stability: 2.6,
            difficulty: 3.5,
            reps: 2,
            intervals: { Again: "1m", Hard: "2d", Good: "6d", Easy: "14d" },
          },
          {
            id: "card-econ-12",
            prompt:
              "O que significa dizer que as contas de um governo fecharam o ano em 'Déficit Público'?",
            answer:
              "Que o governo gastou mais dinheiro do que arrecadou naquele período.",
            explanation:
              "Quando a arrecadação supera os gastos, há Superávit; quando as despesas superam as receitas, ocorre Déficit.",
            options: [
              "Que o governo arrecadou muito mais do que gastou.",
              "Que o governo gastou mais dinheiro do que arrecadou naquele período.",
              "Que todos os impostos foram cancelados durante o ano.",
              "Que a inflação do país chegou exatamente a zero.",
            ],
            stability: 2.9,
            difficulty: 3.1,
            reps: 2,
            intervals: { Again: "1m", Hard: "3d", Good: "7d", Easy: "16d" },
          },
        ],
      },
      {
        id: "econ-step-5",
        title: "Câmbio e comércio externo",
        cards: [
          {
            id: "card-econ-13",
            prompt: "O que é a 'Taxa de Câmbio' na economia?",
            answer:
              "É o preço de uma moeda estrangeira medido em unidades da moeda nacional (ex: quantos reais custam 1 dólar).",
            explanation:
              "A taxa de câmbio varia conforme a entrada e saída de moedas estrangeiras no país, afetando viagens e o preço de itens importados.",
            options: [
              "É a multa cobrada por atrasar a conta de energia elétrica.",
              "É o preço de uma moeda estrangeira medido em unidades da moeda nacional (ex: quantos reais custam 1 dólar).",
              "É o percentual de desconto obrigatório em compras à vista.",
              "É o imposto municipal cobrado sobre terrenos urbanos.",
            ],
            stability: 3.1,
            difficulty: 2.9,
            reps: 3,
            intervals: { Again: "1m", Hard: "3d", Good: "8d", Easy: "18d" },
          },
          {
            id: "card-econ-14",
            prompt:
              "No comércio internacional, qual é a diferença entre Exportação e Importação?",
            answer:
              "Exportação é a venda de produtos nacionais para outros países; Importação é a compra de produtos vindos do exterior.",
            explanation:
              "Quando o Brasil vende soja ou aviões para o exterior, está exportando; quando compra componentes eletrônicos de fora, está importando.",
            options: [
              "Exportação é comprar de fora e Importação é vender para fora.",
              "Exportação é a venda de produtos nacionais para outros países; Importação é a compra de produtos vindos do exterior.",
              "Ambos os termos referem-se apenas ao comércio dentro do mesmo bairro.",
              "Importação significa produzir mercadorias sem usar máquinas.",
            ],
            stability: 3.5,
            difficulty: 2.5,
            reps: 3,
            intervals: { Again: "1m", Hard: "4d", Good: "10d", Easy: "21d" },
          },
          {
            id: "card-econ-15",
            prompt:
              "Quando o dólar sobe fortemente em relação ao real, qual costuma ser o efeito sobre produtos importados (como eletrônicos e trigo)?",
            answer:
              "Eles ficam mais caros em reais para o consumidor brasileiro.",
            explanation:
              "Como os importadores precisam desembolsar mais reais para pagar o mesmo valor em dólar lá fora, esse custo maior é repassado aos preços internos.",
            options: [
              "Eles ficam mais baratos imediatamente nas lojas.",
              "Eles ficam mais caros em reais para o consumidor brasileiro.",
              "O preço em reais nunca é afetado pela cotação do dólar.",
              "Eles deixam de pagar qualquer imposto de circulação.",
            ],
            stability: 3.0,
            difficulty: 3.0,
            reps: 2,
            intervals: { Again: "1m", Hard: "3d", Good: "7d", Easy: "16d" },
          },
        ],
      },
      {
        id: "econ-step-6",
        title: "Investimentos e crédito",
        cards: [
          {
            id: "card-econ-16",
            prompt:
              "No mundo dos investimentos, qual é a diferença básica entre Renda Fixa e Renda Variável?",
            answer:
              "Na Renda Fixa as regras de rendimento são conhecidas desde o início; na Renda Variável o retorno oscila conforme o mercado.",
            explanation:
              "Tesouro Direto e CDB são exemplos de Renda Fixa (mais previsíveis), enquanto ações na Bolsa de Valores são Renda Variável.",
            options: [
              "Renda Fixa não possui nenhum rendimento ao longo do tempo.",
              "Na Renda Fixa as regras de rendimento são conhecidas desde o início; na Renda Variável o retorno oscila conforme o mercado.",
              "Renda Variável garante lucro fixo todos os dias sem risco.",
              "Apenas bancos podem investir em títulos de Renda Fixa.",
            ],
            stability: 2.8,
            difficulty: 3.2,
            reps: 2,
            intervals: { Again: "1m", Hard: "3d", Good: "7d", Easy: "15d" },
          },
          {
            id: "card-econ-17",
            prompt:
              "O que significa o conceito de 'Liquidez' em uma aplicação financeira?",
            answer:
              "A facilidade e a velocidade com que um investimento pode ser transformado novamente em dinheiro disponível na conta.",
            explanation:
              "Um investimento com 'liquidez diária' permite resgatar o dinheiro no mesmo dia; já um imóvel tem baixa liquidez, pois pode levar meses para ser vendido.",
            options: [
              "O risco de o dinheiro evaporar com a inflação anual.",
              "A facilidade e a velocidade com que um investimento pode ser transformado novamente em dinheiro disponível na conta.",
              "A taxa cobrada pelo banco para abrir uma conta corrente.",
              "O lucro máximo garantido por ações de empresas de água.",
            ],
            stability: 2.5,
            difficulty: 3.6,
            reps: 2,
            intervals: { Again: "1m", Hard: "2d", Good: "6d", Easy: "14d" },
          },
          {
            id: "card-econ-18",
            prompt:
              "Por que o 'rotativo do cartão de crédito' (quando não se paga o valor total da fatura) exige muito cuidado do consumidor?",
            answer:
              "Porque possui uma das taxas de juros compostos mais altas do mercado, fazendo a dívida crescer rapidamente.",
            explanation:
              "Ao pagar apenas o valor mínimo da fatura, o saldo restante sofre incidência de juros elevados no mês seguinte, criando um efeito bola de neve.",
            options: [
              "Porque cancela automaticamente o CPF do titular no dia seguinte.",
              "Porque possui uma das taxas de juros compostos mais altas do mercado, fazendo a dívida crescer rapidamente.",
              "Porque impede o consumidor de fazer compras à vista em dinheiro.",
              "Porque devolve todo o dinheiro gasto em dobro para o cliente.",
            ],
            stability: 3.4,
            difficulty: 2.7,
            reps: 3,
            intervals: { Again: "1m", Hard: "4d", Good: "9d", Easy: "20d" },
          },
        ],
      },
    ],
  },
  {
    id: "sub-cs",
    slug: "computer-science",
    title: "Informática e Pensamento Computacional",
    unitNumber: 1,
    unitTitle: "Sistemas, lógica e segurança",
    description:
      "Hardware, software, lógica de programação, planilhas e segurança digital",
    color: "from-purple-500 to-violet-600",
    bannerBg: "bg-purple-600",
    icon: <Cpu className="w-6 h-6 text-white" />,
    milestones: [
      {
        id: "cs-step-1",
        title: "Hardware e sistemas",
        cards: [
          {
            id: "card-cs-1",
            prompt:
              "Na informática básica, qual é a diferença fundamental entre Hardware e Software?",
            answer:
              "Hardware é a parte física do computador (peças e equipamentos) e Software é a parte lógica (programas e aplicativos).",
            explanation:
              "Teclado, monitor e processador são exemplos de hardware; já o Windows, o navegador e o editor de texto são softwares.",
            options: [
              "Hardware são os programas instalados e Software são os cabos e placas.",
              "Hardware é a parte física do computador (peças e equipamentos) e Software é a parte lógica (programas e aplicativos).",
              "Hardware funciona apenas com internet e Software funciona desconectado.",
              "Ambos significam exatamente a mesma coisa.",
            ],
            stability: 3.5,
            difficulty: 2.8,
            reps: 3,
            intervals: { Again: "5m", Hard: "4d", Good: "10d", Easy: "21d" },
          },
          {
            id: "card-cs-2",
            prompt:
              "Qual é a diferença entre a Memória RAM e o Armazenamento (SSD/HD) de um computador ou celular?",
            answer:
              "A memória RAM guarda dados temporariamente enquanto os programas estão abertos; o SSD/HD guarda arquivos permanentemente.",
            explanation:
              "Quando desligamos o computador, o conteúdo da memória RAM é apagado, enquanto fotos e documentos salvos no SSD permanecem guardados.",
            options: [
              "A memória RAM guarda arquivos para sempre e o SSD apaga tudo ao desligar.",
              "A memória RAM guarda dados temporariamente enquanto os programas estão abertos; o SSD/HD guarda arquivos permanentemente.",
              "A memória RAM serve apenas para conectar o computador ao Wi-Fi.",
              "O SSD serve exclusivamente para resfriar o processador.",
            ],
            stability: 2.8,
            difficulty: 3.4,
            reps: 2,
            intervals: { Again: "1m", Hard: "3d", Good: "7d", Easy: "15d" },
          },
          {
            id: "card-cs-3",
            prompt:
              "Como os computadores representam e processam todas as informações (textos, imagens, vídeos) internamente em nível eletrônico?",
            answer:
              "Por meio do sistema binário, composto apenas pelos dígitos 0 e 1 (bits).",
            explanation:
              "Os circuitos eletrônicos trabalham com dois estados físicos (passagem ou não de corrente elétrica), representados pelos dígitos binários 0 e 1.",
            options: [
              "Por meio de letras do alfabeto latino gravadas no processador.",
              "Por meio do sistema binário, composto apenas pelos dígitos 0 e 1 (bits).",
              "Usando exclusivamente números romanos de I a X.",
              "Por ondas sonoras analógicas dentro do disco rígido.",
            ],
            stability: 3.2,
            difficulty: 3.0,
            reps: 3,
            intervals: { Again: "1m", Hard: "3d", Good: "8d", Easy: "18d" },
          },
        ],
      },
      {
        id: "cs-step-2",
        title: "Planilhas e lógica",
        cards: [
          {
            id: "card-cs-4",
            prompt:
              "Em uma planilha eletrônica (como Excel ou Google Planilhas), qual fórmula deve ser usada para somar todos os valores do intervalo de A1 até A5?",
            answer: "=SOMA(A1:A5)",
            explanation:
              "O sinal de dois-pontos (:) indica um intervalo contínuo de células (A1, A2, A3, A4 e A5), enquanto o ponto e vírgula (;) soma apenas células isoladas.",
            options: [
              "=TOTAL(A1-A5)",
              "=SOMA(A1:A5)",
              "=ADICIONAR(A1/A5)",
              "SOMA=(A1+A5)",
            ],
            stability: 2.5,
            difficulty: 3.7,
            reps: 2,
            intervals: { Again: "1m", Hard: "2d", Good: "6d", Easy: "14d" },
          },
          {
            id: "card-cs-5",
            prompt:
              "Na lógica de programação, para que serve uma estrutura condicional 'SE / SENÃO' (IF / ELSE)?",
            answer:
              "Para tomar decisões no programa, executando um bloco de código se uma condição for verdadeira e outro caso seja falsa.",
            explanation:
              "Por exemplo: SE (nota >= 6) exibir 'Aprovado', SENÃO exibir 'Em recuperação'.",
            options: [
              "Para desligar o computador automaticamente após um erro.",
              "Para tomar decisões no programa, executando um bloco de código se uma condição for verdadeira e outro caso seja falsa.",
              "Para apagar todas as variáveis salvas no banco de dados.",
              "Para traduzir o código do inglês para o português.",
            ],
            stability: 2.7,
            difficulty: 3.3,
            reps: 2,
            intervals: { Again: "1m", Hard: "2d", Good: "6d", Easy: "15d" },
          },
          {
            id: "card-cs-6",
            prompt:
              "O que é um 'Algoritmo' na computação e na resolução de problemas?",
            answer:
              "Uma sequência finita e ordenada de passos lógicos para resolver um problema ou realizar uma tarefa.",
            explanation:
              "Assim como uma receita de bolo descreve passo a passo como preparar um prato, um algoritmo descreve para o computador os passos exatos de uma tarefa.",
            options: [
              "Uma peça física instalada dentro da placa de vídeo.",
              "Uma sequência finita e ordenada de passos lógicos para resolver um problema ou realizar uma tarefa.",
              "Um tipo de vírus que bloqueia arquivos em nuvem.",
              "O nome exclusivo da conexão sem fio via satélite.",
            ],
            stability: 3.1,
            difficulty: 2.9,
            reps: 2,
            intervals: { Again: "1m", Hard: "3d", Good: "8d", Easy: "17d" },
          },
        ],
      },
      {
        id: "cs-step-3",
        title: "Segurança e internet",
        cards: [
          {
            id: "card-cs-7",
            prompt:
              "Em segurança da informação, o que caracteriza um golpe de 'Phishing'?",
            answer:
              "O envio de mensagens ou sites falsos que imitam instituições confiáveis para enganar o usuário e roubar suas senhas e dados.",
            explanation:
              "O termo vem de 'pescaria' em inglês: o golpista lança uma 'isca' (como um falso alerta de banco ou promoção) esperando que a vítima clique no link.",
            options: [
              "Um defeito físico que queima a fonte de energia do computador.",
              "O envio de mensagens ou sites falsos que imitam instituições confiáveis para enganar o usuário e roubar suas senhas e dados.",
              "Uma ferramenta oficial para deixar a internet mais rápida.",
              "O bloqueio automático da tela quando o usuário fica inativo.",
            ],
            stability: 3.0,
            difficulty: 3.1,
            reps: 2,
            intervals: { Again: "1m", Hard: "3d", Good: "8d", Easy: "17d" },
          },
          {
            id: "card-cs-8",
            prompt:
              "O que significa a sigla 'HTTPS' (acompanhada do ícone de cadeado) no endereço de um site no navegador?",
            answer:
              "Que a comunicação entre o seu navegador e o site é criptografada, protegendo os dados enviados.",
            explanation:
              "O 'S' no final de HTTPS indica segurança (Secure), impedindo que terceiros na mesma rede leiam senhas ou dados digitados na página.",
            options: [
              "Que o site funciona sem precisar de conexão com a internet.",
              "Que a comunicação entre o seu navegador e o site é criptografada, protegendo os dados enviados.",
              "Que o site pertence obrigatoriamente a um órgão do governo.",
              "Que o computador está com a memória cheia.",
            ],
            stability: 2.9,
            difficulty: 3.2,
            reps: 2,
            intervals: { Again: "1m", Hard: "3d", Good: "7d", Easy: "16d" },
          },
          {
            id: "card-cs-9",
            prompt:
              "Para que serve a Autenticação em Duas Etapas (ou Dois Fatores - 2FA) em contas digitais?",
            answer:
              "Para adicionar uma segunda camada de proteção além da senha, exigindo um código extra enviado ao celular ou aplicativo autenticador.",
            explanation:
              "Mesmo que alguém descubra sua senha, não conseguirá acessar a conta sem o segundo fator de verificação.",
            options: [
              "Para permitir que duas pessoas usem a mesma conta ao mesmo tempo.",
              "Para adicionar uma segunda camada de proteção além da senha, exigindo um código extra enviado ao celular ou aplicativo autenticador.",
              "Para dobrar a velocidade de download de arquivos grandes.",
              "Para recuperar arquivos apagados da lixeira do computador.",
            ],
            stability: 3.3,
            difficulty: 2.8,
            reps: 3,
            intervals: { Again: "5m", Hard: "4d", Good: "9d", Easy: "20d" },
          },
        ],
      },
      {
        id: "cs-step-4",
        title: "Redes e computação em nuvem",
        cards: [
          {
            id: "card-cs-10",
            prompt:
              "O que significa salvar arquivos ou rodar programas em 'Computação em Nuvem' (Cloud Computing)?",
            answer:
              "Que os arquivos e sistemas ficam armazenados em servidores conectados à internet, podendo ser acessados de qualquer lugar.",
            explanation:
              "Serviços como Google Drive, iCloud e OneDrive guardam dados em grandes centros de dados remotos em vez de depender apenas do disco físico do seu aparelho.",
            options: [
              "Que os dados ficam flutuando na atmosfera via ondas de rádio.",
              "Que os arquivos e sistemas ficam armazenados em servidores conectados à internet, podendo ser acessados de qualquer lugar.",
              "Que os arquivos funcionam apenas em dias chuvosos ou nublados.",
              "Que o computador não precisa mais de tela nem de bateria.",
            ],
            stability: 3.4,
            difficulty: 2.6,
            reps: 3,
            intervals: { Again: "1m", Hard: "4d", Good: "9d", Easy: "20d" },
          },
          {
            id: "card-cs-11",
            prompt:
              "Na internet e nas redes de computadores, qual é a função de um 'Endereço IP'?",
            answer:
              "Identificar de forma única cada dispositivo conectado a uma rede para que os dados saibam aonde chegar.",
            explanation:
              "O endereço IP funciona como o CEP e o número da casa de um computador ou celular conectado à internet.",
            options: [
              "Medir a temperatura interna do processador do celular.",
              "Identificar de forma única cada dispositivo conectado a uma rede para que os dados saibam aonde chegar.",
              "Aumentar o brilho da tela automaticamente durante a noite.",
              "Apagar o histórico de pesquisas do navegador a cada hora.",
            ],
            stability: 3.0,
            difficulty: 3.0,
            reps: 2,
            intervals: { Again: "1m", Hard: "3d", Good: "7d", Easy: "16d" },
          },
          {
            id: "card-cs-12",
            prompt:
              "Qual é a diferença entre um Navegador (Browser) e um Mecanismo de Busca?",
            answer:
              "O navegador é o programa usado para abrir páginas (ex: Chrome, Edge), enquanto o buscador é um site que procura conteúdos na web (ex: Google, Bing).",
            explanation:
              "Você instala e abre o navegador no computador para, dentro dele, acessar o site do mecanismo de busca.",
            options: [
              "Não há diferença, ambos são peças físicas dentro do roteador.",
              "O navegador é o programa usado para abrir páginas (ex: Chrome, Edge), enquanto o buscador é um site que procura conteúdos na web (ex: Google, Bing).",
              "O buscador funciona sem internet e o navegador só funciona por cabo.",
              "O navegador serve apenas para editar fotos e vídeos.",
            ],
            stability: 3.2,
            difficulty: 2.8,
            reps: 3,
            intervals: { Again: "1m", Hard: "3d", Good: "8d", Easy: "18d" },
          },
        ],
      },
      {
        id: "cs-step-5",
        title: "Variáveis e repetições",
        cards: [
          {
            id: "card-cs-13",
            prompt: "Na lógica de programação, o que é uma 'Variável'?",
            answer:
              "Um espaço nomeado na memória do computador usado para guardar um valor que pode ser lido ou alterado durante o programa.",
            explanation:
              "Pense em uma variável como uma caixa etiquetada (ex: 'pontuacao = 10') onde o programa armazena e atualiza informações.",
            options: [
              "Um cabo externo usado para ligar o monitor na tomada.",
              "Um espaço nomeado na memória do computador usado para guardar um valor que pode ser lido ou alterado durante o programa.",
              "Um erro irreversível que trava o sistema operacional.",
              "Uma senha fixa que nunca pode ser modificada pelo código.",
            ],
            stability: 3.1,
            difficulty: 2.9,
            reps: 3,
            intervals: { Again: "1m", Hard: "3d", Good: "8d", Easy: "17d" },
          },
          {
            id: "card-cs-14",
            prompt:
              "Para que serve uma estrutura de repetição (Loop, como 'PARA / FOR' ou 'ENQUANTO / WHILE') em um programa?",
            answer:
              "Para executar um mesmo conjunto de instruções várias vezes sem precisar reescrever o código repetidamente.",
            explanation:
              "Se precisamos processar 1.000 nomes de uma lista, um laço de repetição percorre todos os itens com poucas linhas de código.",
            options: [
              "Para deixar o computador em modo de espera (hibernação).",
              "Para executar um mesmo conjunto de instruções várias vezes sem precisar reescrever o código repetidamente.",
              "Para impedir que o usuário digite letras maiúsculas.",
              "Para desconectar o cabo de rede após 5 minutos.",
            ],
            stability: 2.9,
            difficulty: 3.1,
            reps: 2,
            intervals: { Again: "1m", Hard: "3d", Good: "7d", Easy: "16d" },
          },
          {
            id: "card-cs-15",
            prompt:
              "Em programação, que tipo de valor uma variável 'Booleana' (Boolean) pode armazenar?",
            answer:
              "Apenas dois valores lógicos possíveis: Verdadeiro (True) ou Falso (False).",
            explanation:
              "O tipo booleano é a base das decisões lógicas no código, indicando se uma condição foi atendida (True) ou não (False).",
            options: [
              "Textos longos com mais de mil caracteres.",
              "Apenas dois valores lógicos possíveis: Verdadeiro (True) ou Falso (False).",
              "Somente números decimais negativos.",
              "Arquivos de áudio e vídeo em alta definição.",
            ],
            stability: 2.8,
            difficulty: 3.2,
            reps: 2,
            intervals: { Again: "1m", Hard: "3d", Good: "7d", Easy: "15d" },
          },
        ],
      },
      {
        id: "cs-step-6",
        title: "Dados e inteligência artificial",
        cards: [
          {
            id: "card-cs-16",
            prompt:
              "Qual é a diferença entre a extensão de arquivo '.PDF' e '.CSV' no trabalho acadêmico e profissional?",
            answer:
              "O .PDF preserva a formatação visual de documentos para leitura, enquanto o .CSV armazena tabelas de dados separados por vírgulas.",
            explanation:
              "Arquivos .CSV são muito usados para importar e exportar planilhas e bases de dados entre diferentes programas.",
            options: [
              "O .CSV serve apenas para músicas e o .PDF apenas para vídeos.",
              "O .PDF preserva a formatação visual de documentos para leitura, enquanto o .CSV armazena tabelas de dados separados por vírgulas.",
              "Ambos são formatos exclusivos para edição de imagens 3D.",
              "Arquivos .PDF não podem ser abertos em computadores pessoais.",
            ],
            stability: 3.0,
            difficulty: 3.0,
            reps: 2,
            intervals: { Again: "1m", Hard: "3d", Good: "7d", Easy: "16d" },
          },
          {
            id: "card-cs-17",
            prompt:
              "O que significa o conceito de 'Aprendizado de Máquina' (Machine Learning), base da Inteligência Artificial moderna?",
            answer:
              "A capacidade de um sistema computacional identificar padrões em grandes volumes de dados e aprender a fazer previsões sem ser programado regra por regra.",
            explanation:
              "Em vez de um humano escrever todas as regras manualmente, o algoritmo analisa milhares de exemplos para reconhecer imagens, textos ou tendências.",
            options: [
              "O processo físico de ensinar um robô a trocar peças defeituosas.",
              "A capacidade de um sistema computacional identificar padrões em grandes volumes de dados e aprender a fazer previsões sem ser programado regra por regra.",
              "Um curso online obrigatório para técnicos de informática.",
              "O aumento da velocidade do cooler quando o computador esquenta.",
            ],
            stability: 2.7,
            difficulty: 3.3,
            reps: 2,
            intervals: { Again: "1m", Hard: "2d", Good: "6d", Easy: "15d" },
          },
          {
            id: "card-cs-18",
            prompt:
              "Para que serve a realização periódica de um 'Backup' (cópia de segurança) de arquivos importantes?",
            answer:
              "Para garantir que os dados possam ser recuperados caso ocorra falha no aparelho, perda, roubo ou ataque digital.",
            explanation:
              "Manter cópias em um HD externo ou na nuvem evita que trabalhos acadêmicos e documentos importantes sejam perdidos para sempre.",
            options: [
              "Para liberar espaço apagando o sistema operacional do computador.",
              "Para garantir que os dados possam ser recuperados caso ocorra falha no aparelho, perda, roubo ou ataque digital.",
              "Para bloquear o funcionamento do teclado e do mouse.",
              "Para transformar arquivos de texto em placas de memória física.",
            ],
            stability: 3.5,
            difficulty: 2.5,
            reps: 3,
            intervals: { Again: "1m", Hard: "4d", Good: "10d", Easy: "21d" },
          },
        ],
      },
    ],
  },
];

function computeGradeByResponseTime(
  isCorrect: boolean,
  responseTimeSeconds: number,
): ReviewGrade {
  if (!isCorrect) return "Again";
  if (responseTimeSeconds <= 10) return "Easy";
  if (responseTimeSeconds <= 30) return "Good";
  return "Hard";
}

const fsrsScheduler = fsrs(
  generatorParameters({
    enable_fuzz: false,
    request_retention: 0.9,
  }),
);

function updateCardWithFSRS(
  card: FlashcardItem,
  grade: ReviewGrade,
  nowMs: number = Date.now(),
): FlashcardItem {
  const now = new Date(nowMs);
  const baseCard = createEmptyCard(now);

  const fsrsCard = {
    ...baseCard,
    stability: card.stability,
    difficulty: card.difficulty,
    reps: card.reps,
    lapses: card.lapses ?? 0,
    state: card.reps > 0 ? State.Review : State.New,
    last_review: card.lastReviewDate
      ? new Date(card.lastReviewDate)
      : undefined,
  };

  const ratingMap: Record<ReviewGrade, Rating> = {
    Again: Rating.Again,
    Hard: Rating.Hard,
    Good: Rating.Good,
    Easy: Rating.Easy,
  };

  const recordLog = fsrsScheduler.repeat(fsrsCard, now);
  const nextState = recordLog[ratingMap[grade]].card;

  const formatInterval = (due: Date) => {
    const diffMin = Math.round((due.getTime() - nowMs) / 60000);
    if (diffMin < 60) return `${Math.max(1, diffMin)}m`;
    const diffHours = Math.round(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return `${Math.round(diffHours / 24)}d`;
  };

  // If the user misses ("Again"), schedule specifically for 1 minute from now
  const nextDueMs =
    grade === "Again" ? nowMs + 60 * 1000 : nextState.due.getTime();

  return {
    ...card,
    stability: Math.max(0.5, nextState.stability),
    difficulty: nextState.difficulty,
    reps: nextState.reps,
    lapses: nextState.lapses,
    lastReviewDate: nowMs,
    dueDate: nextDueMs,
    intervals: {
      Again: "1m",
      Hard: formatInterval(recordLog[Rating.Hard].card.due),
      Good: formatInterval(recordLog[Rating.Good].card.due),
      Easy: formatInterval(recordLog[Rating.Easy].card.due),
    },
  };
}

export default function MilestoneApp() {
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(1);
  const [hearts, setHearts] = useState(5);
  const [userName, setUserName] = useState<string>("Carregando...");
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  const [tracks, setTracks] = useState<SubjectTrack[]>(INITIAL_TRACKS);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [activeMilestone, setActiveMilestone] = useState<MilestoneStep | null>(
    null,
  );
  const [sessionCards, setSessionCards] = useState<FlashcardItem[]>([]);
  const [completedMilestones, setCompletedMilestones] = useState<string[]>([]);

  useEffect(() => {
    const hydrateFromDatabase = async () => {
      const data = await getUserProgress();
      if (!data) return;

      setUserName(data.user.name);
      setXp(data.user.xp);
      setStreak(data.user.streak);
      setHearts(data.user.hearts);

      if (data.cardProgress.length > 0) {
        const progressMap = new Map(
          data.cardProgress.map((cp) => [cp.flashcardId, cp]),
        );

        const completedStepIds: string[] = [];

        const mergedTracks = INITIAL_TRACKS.map((track) => ({
          ...track,
          milestones: track.milestones.map((step) => {
            const updatedCards = step.cards.map((card) => {
              const saved = progressMap.get(card.id);
              if (!saved) return card;

              return {
                ...card,
                stability: saved.stability,
                difficulty: saved.difficulty,
                reps: saved.reps,
                lapses: saved.lapses,
                dueDate: saved.dueDate,
                lastReviewDate: saved.lastReviewDate,
              };
            });

            // Mark step as completed if all 3 cards in the step have been reviewed in DB
            const isStepDone = updatedCards.every((c) => progressMap.has(c.id));
            if (isStepDone) {
              completedStepIds.push(step.id);
            }

            return {
              ...step,
              cards: updatedCards,
            };
          }),
        }));

        setTracks(mergedTracks);
        setCompletedMilestones(completedStepIds);
      }
    };

    hydrateFromDatabase();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOutUser();
  };

  const [cardIndex, setCardIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);

  const [questionStartTime, setQuestionStartTime] = useState<number>(
    Date.now(),
  );
  const [responseTimeSeconds, setResponseTimeSeconds] = useState<number | null>(
    null,
  );
  const [computedGrade, setComputedGrade] = useState<ReviewGrade | null>(null);

  const activeTrack = tracks.find((t) => t.id === activeTrackId) ?? null;
  const currentCard = sessionCards[cardIndex] ?? null;

  const openLearningPath = (track: SubjectTrack) => {
    setActiveTrackId(track.id);
    setActiveMilestone(null);
  };

  const startMilestoneActivity = (milestone: MilestoneStep) => {
    if (!activeTrack) return;
    const now = Date.now();

    // 1. Find all cards across the ENTIRE subject whose FSRS dueDate has arrived (<= now)
    const dueCardsFromSubject: FlashcardItem[] = [];
    activeTrack.milestones.forEach((step) => {
      step.cards.forEach((card) => {
        const isAlreadyInCurrentStep = milestone.cards.some(
          (c) => c.id === card.id,
        );
        if (
          !isAlreadyInCurrentStep &&
          card.dueDate !== undefined &&
          card.dueDate <= now
        ) {
          dueCardsFromSubject.push({
            ...card,
            isFsrsReview: true,
            originStepTitle: step.title,
          });
        }
      });
    });

    // 2. Get the latest state of the 3 cards belonging to this step
    const currentStepLatest =
      activeTrack.milestones.find((m) => m.id === milestone.id)?.cards ??
      milestone.cards;

    const stepCards = currentStepLatest.map((c) => ({
      ...c,
      isFsrsReview: c.dueDate !== undefined && c.dueDate <= now,
      originStepTitle: milestone.title,
    }));

    // 3. Combine due FSRS review cards from other steps with the current step's cards
    setSessionCards([...dueCardsFromSubject, ...stepCards]);
    setActiveMilestone(milestone);
    setCardIndex(0);
    setSelectedOption(null);
    setIsAnswerRevealed(false);
    setComputedGrade(null);
    setResponseTimeSeconds(null);
    setQuestionStartTime(Date.now());
  };

  const handleRevealAnswer = async () => {
    if (!currentCard || !selectedOption || !activeTrackId) return;

    const nowMs = Date.now();
    const elapsedSeconds = (nowMs - questionStartTime) / 1000;
    const isCorrect = selectedOption === currentCard.answer;
    const autoGrade = computeGradeByResponseTime(isCorrect, elapsedSeconds);

    const updatedCard = updateCardWithFSRS(currentCard, autoGrade, nowMs);

    // Update the card inside the global tracks state so its new dueDate is saved
    setTracks((prevTracks) =>
      prevTracks.map((track) => {
        if (track.id !== activeTrackId) return track;
        return {
          ...track,
          milestones: track.milestones.map((step) => ({
            ...step,
            cards: step.cards.map((c) =>
              c.id === updatedCard.id ? updatedCard : c,
            ),
          })),
        };
      }),
    );

    // Update current session card to display the new FSRS values immediately
    setSessionCards((prev) =>
      prev.map((c, idx) =>
        idx === cardIndex
          ? {
              ...updatedCard,
              isFsrsReview: c.isFsrsReview,
              originStepTitle: c.originStepTitle,
            }
          : c,
      ),
    );

    const xpMap: Record<ReviewGrade, number> = {
      Again: 0,
      Hard: 5,
      Good: 10,
      Easy: 15,
    };

    setResponseTimeSeconds(elapsedSeconds);
    setComputedGrade(autoGrade);
    setIsAnswerRevealed(true);

    setXp((prev) => prev + xpMap[autoGrade]);
    if (autoGrade === "Again") {
      setHearts((prev) => Math.max(0, prev - 1));
    }
    if (activeTrack && activeMilestone) {
      const stepIndex = activeTrack.milestones.findIndex(
        (m) => m.id === activeMilestone.id,
      );

      await saveCardReview({
        track: {
          id: activeTrack.id,
          slug: activeTrack.slug,
          title: activeTrack.title,
          description: activeTrack.description,
        },
        milestone: {
          id: activeMilestone.id,
          title: activeMilestone.title,
          orderIndex: stepIndex >= 0 ? stepIndex + 1 : 1,
        },
        card: {
          id: updatedCard.id,
          prompt: updatedCard.prompt,
          answer: updatedCard.answer,
          explanation: updatedCard.explanation,
          options: updatedCard.options,
          stability: updatedCard.stability,
          difficulty: updatedCard.difficulty,
          reps: updatedCard.reps,
          lapses: updatedCard.lapses ?? 0,
          dueDate: updatedCard.dueDate ?? nowMs,
          lastReviewDate: updatedCard.lastReviewDate ?? nowMs,
        },
        grade: autoGrade,
      });
    }
  };

  const handleNextCard = async () => {
    if (!activeMilestone) return;

    if (cardIndex + 1 < sessionCards.length) {
      setCardIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerRevealed(false);
      setComputedGrade(null);
      setResponseTimeSeconds(null);
      setQuestionStartTime(Date.now());
    } else {
      if (!completedMilestones.includes(activeMilestone.id)) {
        setCompletedMilestones((prev) => [...prev, activeMilestone.id]);
      }
      setStreak((prev) => prev + 1);
      setActiveMilestone(null);
      await incrementUserStreak();
    }
  };

  // Horizontal offsets to create the Duolingo-style winding vertical path
  const nodeOffsets = [
    "translate-x-8",
    "-translate-x-6",
    "-translate-x-12",
    "-translate-x-4",
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation & Gamification HUD */}
      {/* Top Navigation & Gamification HUD */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-emerald-500/20">
              M
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                Milestone
              </span>
              <span className="block text-xs text-slate-400">
                Formação Transversal no Ensino Superior • FSRS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            {/* Gamification Stats */}
            <div
              className="flex items-center gap-2 bg-slate-800/90 px-3.5 py-1.5 rounded-full border border-slate-700"
              title="Ofensiva de estudos"
            >
              <Flame className="w-5 h-5 text-orange-400 fill-orange-400" />
              <span className="font-bold text-orange-400">{streak}</span>
              <span className="text-xs text-slate-400 hidden md:inline">
                dias
              </span>
            </div>

            <div
              className="flex items-center gap-2 bg-slate-800/90 px-3.5 py-1.5 rounded-full border border-slate-700"
              title="Pontos de Experiência"
            >
              <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span className="font-bold text-amber-400">{xp} XP</span>
            </div>

            <div
              className="flex items-center gap-2 bg-slate-800/90 px-3.5 py-1.5 rounded-full border border-slate-700"
              title="Vidas restantes"
            >
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
              <span className="font-bold text-rose-400">{hearts}</span>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            {/* Logged-in User Profile & Logout Button */}
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex items-center gap-2 bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-700/80">
                <UserIcon className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200 max-w-[120px] truncate">
                  {userName}
                </span>
              </div>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                title="Sair da conta"
                className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 px-3 py-1.5 rounded-full text-xs font-bold transition disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {isLoggingOut ? "Saindo..." : "Sair"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto w-full px-6 py-10 flex-1">
        {/* VIEW 1: Subject Selection Grid */}
        {!activeTrack && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-extrabold text-white">
                Trilhas de Conhecimento Transversal
              </h1>
              <p className="text-slate-400 mt-1">
                Fortaleça sua base acadêmica utilizando Recuperação Ativa e
                Repetição Espaçada FSRS.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tracks.map((track) => {
                const totalCards = track.milestones.reduce(
                  (acc, m) => acc + m.cards.length,
                  0,
                );
                return (
                  <div
                    key={track.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div
                          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${track.color} flex items-center justify-center shadow-md`}
                        >
                          {track.icon}
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {track.milestones.length} Etapas • {totalCards}{" "}
                          Cartões
                        </span>
                      </div>

                      <h2 className="text-xl font-bold text-white mb-1">
                        {track.title}
                      </h2>
                      <p className="text-sm text-slate-400 mb-6">
                        {track.description}
                      </p>
                    </div>

                    <button
                      onClick={() => openLearningPath(track)}
                      className={`w-full py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r ${track.color} hover:opacity-95 transition flex items-center justify-center gap-2 shadow-md`}
                    >
                      <Brain className="w-5 h-5" />
                      Iniciar Sessão de Estudo
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: Duolingo-Style Learning Path (Rota de Aprendizado) */}
        {activeTrack && !activeMilestone && (
          <div className="max-w-xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setActiveTrackId(null)}
                className="text-sm text-slate-400 hover:text-white transition font-medium"
              >
                ← Voltar para as Trilhas
              </button>
              <span className="text-xs text-slate-400">
                3 cartões por atividade
              </span>
            </div>

            {/* Subject Header Title */}
            <div className="border-b border-slate-800 pb-4 mb-6">
              <h1 className="text-2xl font-extrabold text-white">
                {activeTrack.title}
              </h1>
            </div>

            {/* Unit Banner (Duolingo Style) */}
            <div
              className={`${activeTrack.bannerBg} rounded-2xl p-5 text-white shadow-lg flex items-center justify-between mb-12`}
            >
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider opacity-90 block mb-1">
                  UNIDADE {activeTrack.unitNumber}
                </span>
                <h2 className="text-xl font-extrabold">
                  {activeTrack.unitTitle}
                </h2>
              </div>
              <div className="border-2 border-white/40 bg-white/10 rounded-xl p-2.5">
                <BookMarked className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Winding Vertical Path of Circular Nodes */}
            <div className="flex flex-col items-center space-y-10 py-4">
              {activeTrack.milestones.map((milestone, index) => {
                const isCompleted = completedMilestones.includes(milestone.id);
                const offsetClass = nodeOffsets[index % nodeOffsets.length];

                return (
                  <div
                    key={milestone.id}
                    className={`flex flex-col items-center transform ${offsetClass}`}
                  >
                    <button
                      onClick={() => startMilestoneActivity(milestone)}
                      className={`w-20 h-20 rounded-full flex items-center justify-center transition-transform active:translate-y-1 ${
                        isCompleted
                          ? "bg-orange-500 hover:bg-orange-400 shadow-[0_7px_0_#c2410c]"
                          : "bg-emerald-500 hover:bg-emerald-400 shadow-[0_7px_0_#047857]"
                      }`}
                      title={`Iniciar: ${milestone.title} (3 cartões)`}
                    >
                      {isCompleted ? (
                        <Check className="w-9 h-9 text-white stroke-[3]" />
                      ) : (
                        <Star className="w-9 h-9 text-white fill-white" />
                      )}
                    </button>

                    <span className="mt-3 font-extrabold text-sm text-slate-100 text-center max-w-[180px]">
                      {milestone.title}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {milestone.cards.length} cartões
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 3: Active Recall & FSRS Flashcard Session (3 Cards per Step) */}
        {activeTrack && activeMilestone && (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setActiveMilestone(null)}
                className="text-sm text-slate-400 hover:text-white transition"
              >
                ← Voltar para a Rota de Aprendizado
              </button>
              <div className="text-right">
                <span className="block text-xs text-emerald-400 font-bold">
                  {activeMilestone.title}
                </span>
                <span className="text-sm font-semibold text-slate-300">
                  Cartão {cardIndex + 1} de {sessionCards.length}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden mb-8">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{
                  width: `${((cardIndex + 1) / sessionCards.length) * 100}%`,
                }}
              />
            </div>

            {currentCard && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
                {/* FSRS Metadata Badge */}
                <div className="flex flex-wrap items-center gap-3 mb-6 text-xs text-slate-400">
                  <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700">
                    Estabilidade FSRS:{" "}
                    <strong className="text-emerald-400">
                      {currentCard.stability.toFixed(1)}d
                    </strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700">
                    Dificuldade:{" "}
                    <strong className="text-amber-400">
                      {currentCard.difficulty.toFixed(1)}/10
                    </strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700">
                    Revisões:{" "}
                    <strong className="text-white">{currentCard.reps}</strong>
                  </span>
                </div>

                {/* Question Prompt */}
                <h3 className="text-2xl font-bold text-white leading-snug mb-6">
                  {currentCard.prompt}
                </h3>

                {/* Active Recall Multiple-Choice Challenge */}
                <div className="space-y-3 mb-6">
                  {currentCard.options.map((option) => {
                    const isSelected = selectedOption === option;
                    const isCorrect = option === currentCard.answer;

                    let buttonStyle =
                      "border-slate-800 bg-slate-800/50 hover:border-slate-600 text-slate-200";
                    if (isAnswerRevealed) {
                      if (isCorrect) {
                        buttonStyle =
                          "border-emerald-500 bg-emerald-500/15 text-emerald-300";
                      } else if (isSelected && !isCorrect) {
                        buttonStyle =
                          "border-rose-500 bg-rose-500/15 text-rose-300";
                      }
                    } else if (isSelected) {
                      buttonStyle =
                        "border-cyan-500 bg-cyan-500/15 text-cyan-200";
                    }

                    return (
                      <button
                        key={option}
                        disabled={isAnswerRevealed}
                        onClick={() => setSelectedOption(option)}
                        className={`w-full text-left p-4 rounded-xl border-2 font-medium transition flex items-center justify-between ${buttonStyle}`}
                      >
                        <span>{option}</span>
                        {isAnswerRevealed && isCorrect && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Reveal Button or Automatic FSRS Feedback Panel */}
                {!isAnswerRevealed ? (
                  <button
                    disabled={!selectedOption}
                    onClick={handleRevealAnswer}
                    className="w-full py-4 rounded-xl bg-white text-slate-950 font-extrabold hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Verificar Resposta
                  </button>
                ) : (
                  <div className="mt-6 pt-6 border-t border-slate-800 animate-fadeIn">
                    <div className="bg-slate-800/70 rounded-2xl p-4 mb-4 border border-slate-700">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
                        <Sparkles className="w-4 h-4" />
                        Explicação do Conceito
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {currentCard.explanation}
                      </p>
                    </div>

                    {computedGrade && responseTimeSeconds !== null && (
                      <div className="flex items-center justify-between bg-slate-800/50 border border-slate-700/80 rounded-xl px-4 py-3 mb-6 text-xs text-slate-300">
                        <span>
                          Tempo de resposta:{" "}
                          <strong className="text-white">
                            {responseTimeSeconds.toFixed(1)}s
                          </strong>
                        </span>
                        <span>
                          Classificação FSRS:{" "}
                          <strong
                            className={
                              computedGrade === "Again"
                                ? "text-rose-400"
                                : computedGrade === "Hard"
                                  ? "text-amber-400"
                                  : computedGrade === "Good"
                                    ? "text-emerald-400"
                                    : "text-cyan-400"
                            }
                          >
                            {GRADE_LABELS[computedGrade]}
                          </strong>{" "}
                          (próxima revisão em{" "}
                          <strong className="text-white">
                            {currentCard.intervals[computedGrade]}
                          </strong>
                          )
                        </span>
                      </div>
                    )}

                    <button
                      onClick={handleNextCard}
                      className="w-full py-4 rounded-xl bg-emerald-500 text-slate-950 font-extrabold hover:bg-emerald-400 transition"
                    >
                      {cardIndex + 1 < activeMilestone.cards.length
                        ? "Próximo Cartão"
                        : "Concluir Atividade"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
