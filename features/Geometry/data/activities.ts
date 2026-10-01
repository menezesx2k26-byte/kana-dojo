import type { DiagnosticKind } from '../lib/concepts';
import { altitudeActivity } from './altitudeActivity';
import type { Construction, RightAngle, EqualMark } from '../lib/scene';
import rawCatalog from './catalog.json';
import {
  add,
  mul,
  equal,
  parsePoint,
  parseScalar,
  parseLine,
  onLine,
  scalar,
  approximate,
  samePoint,
  type Point,
  type Scalar,
  type Linear,
} from '../lib/math';

export interface Question {
  id: string;
  list: number;
  number: number;
  page: number;
  statement: string;
  topics: string[];
  provenance: string;
  needsFigure: boolean;
  sourceVersion: string;
}
export interface Evidence {
  label: string;
  value: Scalar;
}
export interface Step {
  id: string;
  label: string;
  prompt: string;
  kind: 'point' | 'line' | 'scalar' | 'membership';
  placeholder: string;
  requires: string[];
  check: (answer: string, answers: Record<string, string>) => boolean;
  diagnose?: (answer: string, answers: Record<string, string>) => string;
  diagnoseKind?: (
    answer: string,
    answers: Record<string, string>,
  ) => DiagnosticKind;
  evidence?: (answer: string, answers: Record<string, string>) => Evidence[][];
  vectorProof?: {
    label: string;
    a: string;
    b: string;
    weightA: string;
    weightB: string;
  };
  hints: string[];
  divergence: string;
  decision: string;
}
export interface PlotPoint {
  name: string;
  x: number;
  y: number;
  revealAfter?: string;
}
export interface Visual {
  type: 'points' | 'segment' | 'line' | 'intersection' | 'distance' | 'area';
  exploration?:
    | 'triangle-altitudes'
    | 'comparison-median'
    | 'comparison-altitude'
    | 'comparison-bisector';
  description: string;
  points: PlotPoint[];
  lines?: { equation: string; after?: string }[];
  segments?: [string, string][];
  constructions?: Construction[];
  rightAngles?: RightAngle[];
  equalMarks?: EqualMark[];
  activeVertex?: string;
  oppositeSide?: [string, string];
  extensions?: Construction[];
}
export interface Activity {
  id: string;
  title: string;
  given: string[];
  target: string;
  tools: string[];
  reference: string;
  steps: Step[];
  visual: Visual;
  note: string;
}
const point = (s: string) => parsePoint(s);
const subtract = (a: Scalar, b: Scalar) => add(a, mul(b, scalar(-1)));
const sumP = (a: Point, b: Point): Point => ({
  x: add(a.x, b.x),
  y: add(a.y, b.y),
});
const scaleP = (a: Point, n: number): Point => ({
  x: mul(a.x, scalar(n)),
  y: mul(a.y, scalar(n)),
});
const distanceSquared = (a: Point, b: Point): Scalar =>
  add(
    mul(subtract(a.x, b.x), subtract(a.x, b.x)),
    mul(subtract(a.y, b.y), subtract(a.y, b.y)),
  );
const residual = (l: Linear, p: Point) =>
  add(add(mul(l.x, p.x), mul(l.y, p.y)), l.c);
const normDot = (a: Linear, b: Linear) => add(mul(a.x, b.x), mul(a.y, b.y));
const ev = (label: string, value: Scalar): Evidence => ({ label, value });
function midpoint(
  id: string,
  a: string,
  b: string,
  names: [string, string],
  requires: string[] = [],
): Step {
  return {
    id,
    label: 'Ponto médio',
    kind: 'point',
    requires,
    placeholder: '(x, y)',
    prompt: `Quais são as coordenadas do ponto médio de ${names.join(' e ')}? Na relação abaixo, use os nomes dos pontos.`,
    check: s => samePoint(scaleP(point(s), 2), sumP(point(a), point(b))),
    diagnose: s =>
      equal(mul(point(s).x, scalar(2)), add(point(a).x, point(b).x))
        ? 'A abscissa está correta. Revise somente a média das ordenadas, mantendo a primeira coordenada.'
        : 'A primeira divergência está na abscissa: confira a soma e a divisão por dois antes de revisar a ordenada.',
    vectorProof: {
      label: 'M',
      a: names[0],
      b: names[1],
      weightA: '1/2',
      weightB: '1/2',
    },
    hints: [
      'Qual ponto fica à mesma distância dos dois extremos?',
      'Aplique a média separadamente à abscissa e à ordenada.',
      'A relação é M=(primeiro ponto+segundo ponto)/2. Faça as duas médias.',
    ],
    divergence:
      'Revise primeiro a média das abscissas; depois a das ordenadas. Uma coordenada correta será preservada no feedback.',
    decision: 'Calcular o ponto médio antes de usá-lo como premissa.',
  };
}
function distance(
  id: string,
  a: string,
  b: string,
  requires: string[] = [],
): Step {
  const squared = distanceSquared(point(a), point(b));
  return {
    id,
    label: 'Comprimento',
    kind: 'scalar',
    requires,
    placeholder: 'sqrt(n)/2',
    prompt:
      'Qual é o comprimento? Registre também o quadrado da distância, calculado a partir das diferenças de coordenadas.',
    check: s => {
      const d = parseScalar(s);
      return approximate(d) >= 0 && equal(mul(d, d), squared);
    },
    evidence: () => [[ev('d^2', squared)]],
    hints: [
      'Entre quais dois pontos você precisa medir?',
      'Os deslocamentos horizontal e vertical são os catetos de um triângulo retângulo.',
      'Calcule (Δx)²+(Δy)²; só depois extraia a raiz não negativa.',
    ],
    divergence:
      'A distância deve ser não negativa. Revise as diferenças de coordenadas e a soma de seus quadrados.',
    decision: 'Medir o segmento com o teorema de Pitágoras.',
  };
}
const A = point('(2,-1)');
const lineQ1: Step = {
  id: 'reta',
  label: 'Equação da reta',
  kind: 'line',
  requires: ['medio'],
  placeholder: 'ax + by + c = 0',
  prompt:
    'Construa a reta que passa por A e pelo ponto médio validado. Pode usar determinante, inclinação ou outra rota válida. Confirme a passagem pelos dois pontos.',
  check: (s, answers) =>
    onLine(A, parseLine(s)) && onLine(point(answers.medio), parseLine(s)),
  diagnose: (s, answers) =>
    !onLine(A, parseLine(s))
      ? 'A primeira divergência é a passagem por A=(2,−1). Confira a substituição e os sinais. O ponto médio validado continua correto.'
      : !onLine(point(answers.medio), parseLine(s))
        ? 'A equação passa por A, mas não passa pelo M validado. Revise esta condição, preservando o ponto médio.'
        : 'Confira as condições da reta.',
  evidence: (s, answers) => [
    [
      ev('s(A)', residual(parseLine(s), A)),
      ev('s(M)', residual(parseLine(s), point(answers.medio))),
    ],
  ],
  hints: [
    'Uma reta fica determinada por dois pontos distintos. Quais você já tem?',
    'Use A e M do ledger. O determinante nulo ou a forma ponto-inclinação são caminhos possíveis.',
    'Verifique separadamente se A e M tornam o lado esquerdo da sua equação igual a zero.',
  ],
  divergence:
    'A primeira condição que falha é a passagem por A ou pelo ponto médio já validado. Confira os sinais antes de recomeçar.',
  decision:
    'Caracterizar a reta pelos dois pontos, independentemente da forma da equação.',
};
function membership(id: string, name: string, p: string): Step {
  return {
    id,
    label: `Pertinência de ${name}`,
    kind: 'membership',
    requires: ['reta'],
    placeholder: 'sim ou não',
    prompt: `O ponto ${name}=${p} pertence à sua reta? Registre o valor do lado esquerdo após substituir suas coordenadas.`,
    check: (s, answers) => {
      const yes = onLine(point(p), parseLine(answers.reta));
      return /^(sim|pertence)$/i.test(s.trim())
        ? yes
        : /^(não|nao|não pertence|nao pertence)$/i.test(s.trim())
          ? !yes
          : false;
    },
    evidence: (_s, answers) => [
      [ev(`s(${name})`, residual(parseLine(answers.reta), point(p)))],
    ],
    hints: [
      'Substituir as coordenadas é um teste algébrico de pertinência.',
      'Zero indica que pertence. Um valor diferente de zero indica que não pertence.',
      'Use os coeficientes da sua equação; uma equação multiplicada por um fator pode dar um resíduo diferente, com a mesma conclusão.',
    ],
    divergence:
      'A conclusão deve concordar com o resíduo da substituição na sua equação validada.',
    decision:
      'Testar pertinência por substituição, sem depender da aparência da figura.',
  };
}
const all: Activity[] = [
  {
    id: 'lista-2-q01',
    title: 'Uma reta, dois testes',
    given: [
      'A=(2, −1)',
      'B=(0, −1)',
      'C=(−3, 2)',
      's passa por A e pelo ponto médio de BC',
    ],
    target: 'Uma equação geral de s e a pertinência de O=(0,0) e T=(−7,3).',
    tools: [
      'Ponto médio + determinante',
      'Ponto médio + inclinação',
      'Construção equivalente + substituição',
    ],
    reference: 'Caderno, pp. 9 e 12–13',
    steps: [
      midpoint('medio', '(0,-1)', '(-3,2)', ['B', 'C']),
      lineQ1,
      membership('origem', 'O', '(0,0)'),
      membership('teste', 'T', '(-7,3)'),
    ],
    visual: {
      type: 'line',
      description:
        'A, B e C estão no plano. O ponto M só aparece após seu cálculo ser validado; a reta s só aparece após sua validação. Nenhuma medida final é mostrada.',
      points: [
        { name: 'A', x: 2, y: -1 },
        { name: 'B', x: 0, y: -1 },
        { name: 'C', x: -3, y: 2 },
        { name: 'M', x: -1.5, y: 0.5, revealAfter: 'medio' },
      ],
      segments: [['B', 'C']],
      lines: [{ equation: '3x+7y+1=0', after: 'reta' }],
    },
    note: 'Uma equação geral pode ser multiplicada por qualquer fator não nulo. A pertença dos pontos permanece igual.',
  },
  {
    id: 'lista-1-q02',
    title: 'A distância até a origem',
    given: ['P=(3, −4)', 'O=(0, 0)'],
    target: 'Distância de P à origem.',
    tools: ['Diferenças de coordenadas + Pitágoras'],
    reference: 'Caderno, pp. 7–8',
    steps: [distance('distancia', '(3,-4)', '(0,0)')],
    visual: {
      type: 'distance',
      description:
        'P e O com projeções horizontal e vertical. Os catetos mostram os deslocamentos; a medida do segmento não é revelada.',
      points: [
        { name: 'P', x: 3, y: -4 },
        { name: 'O', x: 0, y: 0 },
        { name: 'H', x: 3, y: 0 },
      ],
      rightAngles: [
        { at: { x: 3, y: 0 }, along: { x: -1, y: 0 }, toward: { x: 0, y: -1 } },
      ],
      segments: [
        ['P', 'H'],
        ['H', 'O'],
        ['P', 'O'],
      ],
    },
    note: 'Comprimento é não negativo; quadrados eliminam o sinal dos deslocamentos.',
  },
  {
    id: 'lista-1-q07',
    title: 'A mediana começa no meio',
    given: ['P=(1, 1)', 'Q=(3, −4)', 'R=(−5, 2)'],
    target: 'Comprimento da mediana com extremidade em Q.',
    tools: ['Ponto médio de PR + distância a Q'],
    reference: 'Caderno, pp. 7–9',
    steps: [
      midpoint('medio', '(1,1)', '(-5,2)', ['P', 'R']),
      distance('distancia', '(-2,1.5)', '(3,-4)', ['medio']),
    ],
    visual: {
      type: 'segment',
      description:
        'O triângulo PQR e o lado PR estão visíveis. M e o segmento QM são liberados somente depois do ponto médio validado.',
      points: [
        { name: 'P', x: 1, y: 1 },
        { name: 'Q', x: 3, y: -4 },
        { name: 'R', x: -5, y: 2 },
        { name: 'M', x: -2, y: 1.5, revealAfter: 'medio' },
      ],
      equalMarks: [
        { a: { x: 1, y: 1 }, b: { x: -2, y: 1.5 }, after: 'medio' },
        { a: { x: -2, y: 1.5 }, b: { x: -5, y: 2 }, after: 'medio' },
      ],
      segments: [
        ['P', 'Q'],
        ['Q', 'R'],
        ['R', 'P'],
        ['Q', 'M'],
      ],
    },
    note: 'Mediana liga um vértice ao ponto médio do lado oposto; não é necessariamente perpendicular.',
  },
  {
    id: 'lista-2-q04',
    title: 'O encontro de duas retas',
    given: ['A=(1, 2)', 'B=(11, 7)', 's: x+3y=17'],
    target: 'Ponto de interseção da reta AB com s.',
    tools: ['Inclinação + sistema', 'Determinante + sistema'],
    reference: 'Caderno, pp. 12–15',
    steps: [
      {
        id: 'reta',
        label: 'Reta AB',
        kind: 'line',
        requires: [],
        placeholder: 'ax + by + c = 0',
        prompt:
          'Qual reta r passa por A e B? Verifique a passagem pelos dois pontos.',
        check: s =>
          onLine(point('(1,2)'), parseLine(s)) &&
          onLine(point('(11,7)'), parseLine(s)),
        evidence: s => [
          [
            ev('r(A)', residual(parseLine(s), point('(1,2)'))),
            ev('r(B)', residual(parseLine(s), point('(11,7)'))),
          ],
        ],
        hints: [
          'Qual relação liga a reta a esses dois pontos?',
          'Use determinante nulo ou calcule a inclinação com as duas diferenças.',
          'Teste sua equação substituindo A e B.',
        ],
        divergence: 'A reta precisa passar por ambos os pontos dados.',
        decision: 'Construir a reta a partir dos dois pontos.',
      },
      {
        id: 'intersecao',
        label: 'Interseção',
        kind: 'point',
        requires: ['reta'],
        placeholder: '(x, y)',
        prompt:
          'Resolva o sistema pela rota que preferir. O ponto P deve satisfazer simultaneamente as duas equações.',
        check: (s, a) =>
          onLine(point(s), parseLine(a.reta)) &&
          onLine(point(s), parseLine('x+3y=17')),
        evidence: (s, a) => [
          [
            ev('r(P)', residual(parseLine(a.reta), point(s))),
            ev('s(P)', residual(parseLine('x+3y-17=0'), point(s))),
          ],
        ],
        hints: [
          'O que deve ser verdade nas duas retas ao mesmo tempo?',
          'Substituição e eliminação são caminhos válidos.',
          'Depois de calcular P, teste suas coordenadas em cada equação.',
        ],
        divergence:
          'Confira primeiro a reta r; se ela for satisfeita, revise a substituição na reta s.',
        decision: 'Resolver e conferir um sistema de duas equações.',
      },
    ],
    visual: {
      type: 'intersection',
      description:
        'Os pontos A e B e a reta s são dados. A reta r aparece depois de sua validação. O ponto de interseção é liberado só após a conclusão.',
      points: [
        { name: 'A', x: 1, y: 2 },
        { name: 'B', x: 11, y: 7 },
        { name: 'P', x: 5, y: 4, revealAfter: 'intersecao' },
      ],
      lines: [{ equation: 'x+3y=17' }, { equation: 'x-2y+3=0', after: 'reta' }],
    },
    note: 'Uma interseção é um ponto que satisfaz as duas equações, não apenas uma delas.',
  },
  {
    id: 'lista-2-q15',
    title: 'Uma perpendicular por um ponto',
    given: ['r: y=2x+1', 'P=(4, 2)'],
    target: 'Uma equação da reta s perpendicular a r e passando por P.',
    tools: ['Inclinações + ponto-inclinação', 'Vetores normais + pertinência'],
    reference: 'Caderno, pp. 12–14',
    steps: [
      {
        id: 'reta',
        label: 'Reta perpendicular',
        kind: 'line',
        requires: [],
        placeholder: 'ax + by + c = 0',
        prompt:
          'Construa s. Justifique perpendicularidade e passagem por P. Você pode usar produto das inclinações ou dos vetores normais.',
        check: s =>
          onLine(point('(4,2)'), parseLine(s)) &&
          equal(normDot(parseLine(s), parseLine('2x-y+1=0')), {}),
        evidence: s => {
          const l = parseLine(s),
            r = parseLine('2x-y+1=0');
          const paths = [
            [
              ev('n_r.n_s', normDot(l, r)),
              ev('s(P)', residual(l, point('(4,2)'))),
            ],
          ];
          if (equal(normDot(l, r), {}))
            paths.push([
              ev('m_r*m_s', scalar(-1)),
              ev('s(P)', residual(l, point('(4,2)'))),
            ]);
          return paths;
        },
        hints: [
          'Que condição algébrica garante um ângulo reto?',
          'Para retas não verticais, o produto das inclinações deve ser −1.',
          'Depois da perpendicularidade, imponha a passagem por P.',
        ],
        divergence:
          'Verifique primeiro a perpendicularidade e depois a passagem por P. Uma inclinação correta pode estar acompanhada de termo constante incorreto.',
        decision: 'Combinar perpendicularidade e pertinência.',
      },
    ],
    visual: {
      type: 'line',
      description:
        'P e a reta dada r estão visíveis. A perpendicular s aparece somente depois da validação.',
      points: [{ name: 'P', x: 4, y: 2 }],
      rightAngles: [
        {
          at: { x: 1.2, y: 3.4 },
          along: { x: 1, y: 2 },
          toward: { x: 2, y: -1 },
          after: 'reta',
        },
      ],
      lines: [{ equation: 'y=2x+1' }, { equation: 'x+2y-8=0', after: 'reta' }],
    },
    note: 'O teste por produto de vetores normais também aceita equações em formas gerais equivalentes.',
  },
  {
    id: 'lista-2-q16',
    title: 'A mediatriz em duas condições',
    given: ['A=(1, −2)', 'B=(5, 4)'],
    target: 'Equação da mediatriz de AB.',
    tools: ['Ponto médio + perpendicularidade'],
    reference:
      'Lista 2 Q16; caracterização de mediatriz: Derivado. Caderno, pp. 9 e 14.',
    steps: [
      midpoint('medio', '(1,-2)', '(5,4)', ['A', 'B']),
      {
        id: 'reta',
        label: 'Mediatriz',
        kind: 'line',
        requires: ['medio'],
        placeholder: 'ax + by + c = 0',
        prompt:
          'A mediatriz passa pelo ponto médio e é perpendicular a AB. Registre essas duas condições.',
        check: (s, a) =>
          onLine(point(a.medio), parseLine(s)) &&
          equal(normDot(parseLine(s), parseLine('3x-2y-7=0')), {}),
        evidence: (s, a) => [
          [
            ev('s(M)', residual(parseLine(s), point(a.medio))),
            ev('n_AB.n_s', normDot(parseLine(s), parseLine('3x-2y-7=0'))),
          ],
        ],
        hints: [
          'Onde estão os pontos equidistantes de A e B?',
          'A mediatriz passa pelo meio de AB e forma ângulo reto com AB.',
          'Confira o ponto médio no ledger e a perpendicularidade entre as direções.',
        ],
        divergence:
          'A mediatriz deve passar por M e ser perpendicular a AB; revise a primeira condição que falhar.',
        decision: 'Usar conjuntamente as duas propriedades da mediatriz.',
      },
    ],
    visual: {
      type: 'segment',
      description:
        'A e B e seu segmento aparecem. O ponto médio e a mediatriz são liberados conforme os passos validados.',
      points: [
        { name: 'A', x: 1, y: -2 },
        { name: 'B', x: 5, y: 4 },
        { name: 'M', x: 3, y: 1, revealAfter: 'medio' },
      ],
      equalMarks: [
        { a: { x: 1, y: -2 }, b: { x: 3, y: 1 }, after: 'medio' },
        { a: { x: 3, y: 1 }, b: { x: 5, y: 4 }, after: 'medio' },
      ],
      rightAngles: [
        {
          at: { x: 3, y: 1 },
          along: { x: 2, y: 3 },
          toward: { x: 3, y: -2 },
          after: 'reta',
        },
      ],
      segments: [['A', 'B']],
      lines: [{ equation: '2x+3y-9=0', after: 'reta' }],
    },
    note: 'A caracterização da mediatriz é apresentada como derivação geométrica, pois sua definição não é desenvolvida formalmente no caderno.',
  },
  {
    id: 'lista-2-q30',
    title: 'A menor distância à reta',
    given: ['P=(5, 6)', 'r: 2x−3y+5=0'],
    target: 'Distância de P à reta r.',
    tools: ['Distância ponto-reta', 'Projeção perpendicular'],
    reference: 'Caderno, p. 16',
    steps: [
      {
        id: 'distancia',
        label: 'Distância ponto-reta',
        kind: 'scalar',
        requires: [],
        placeholder: 'n/sqrt(n)',
        prompt:
          'Calcule a distância. Como evidência, registre o módulo da substituição e o quadrado da norma do vetor normal.',
        check: s => {
          const d = parseScalar(s);
          return approximate(d) >= 0 && equal(mul(d, d), parseScalar('9/13'));
        },
        evidence: () => [[ev('|r(P)|', scalar(3)), ev('a^2+b^2', scalar(13))]],
        hints: [
          'A menor distância segue uma perpendicular à reta.',
          'Na forma ax+by+c=0, divida |ax_P+by_P+c| por sqrt(a²+b²).',
          'Confira o módulo no numerador e a norma do vetor normal no denominador.',
        ],
        divergence:
          'A distância deve ser não negativa; confira primeiro o numerador e depois a norma.',
        decision: 'Normalizar o resíduo da equação para obter uma distância.',
      },
    ],
    visual: {
      type: 'distance',
      description:
        'P e a reta r aparecem. O pé H da perpendicular e o segmento PH só são liberados após o cálculo validado.',
      points: [
        { name: 'P', x: 5, y: 6 },
        { name: 'H', x: 71 / 13, y: 69 / 13, revealAfter: 'distancia' },
      ],
      lines: [{ equation: '2x-3y+5=0' }],
      rightAngles: [
        {
          at: { x: 71 / 13, y: 69 / 13 },
          along: { x: 3, y: 2 },
          toward: { x: -2, y: 3 },
          after: 'distancia',
        },
      ],
      segments: [['P', 'H']],
    },
    note: 'Equações proporcionais produzem a mesma distância: o fator é cancelado pelo módulo e pela norma.',
  },
];

// Persisted IDs are untrusted: inherited Object keys must never be activities.
export const activities: Record<string, Activity> = Object.assign(
  Object.create(null),
  Object.fromEntries([...all, altitudeActivity].map(a => [a.id, a])),
);
const editorial: Record<string, string> = {
  'lista-2-q01':
    'A reta s passa por A=(2, −1) e pelo ponto médio de BC, sendo B=(0, −1) e C=(−3, 2). a) Escreva uma equação geral para s. b) s passa pela origem? E pelo ponto (−7, 3)?',
  'lista-1-q02':
    'Calcule a distância do ponto P=(3, −4) à origem do sistema cartesiano.',
  'lista-1-q07':
    'Dados os vértices P=(1, 1), Q=(3, −4) e R=(−5, 2) de um triângulo, calcule o comprimento da mediana que tem extremidade no vértice Q.',
  'lista-2-q04':
    'Determine a interseção da reta que passa pelos pontos (1, 2) e (11, 7) com a reta de equação x+3y=17.',
  'lista-2-q15':
    'Determine uma equação da reta perpendicular à reta y=2x+1 e que passa pelo ponto (4, 2).',
  'lista-2-q16':
    'Determine uma equação da mediatriz do segmento que une os pontos (1, −2) e (5, 4).',
  'lista-2-q30': 'Determine a distância do ponto P=(5, 6) à reta r: 2x−3y+5=0.',
  'lista-2-q05':
    'Considere a parábola y=x²−x+1. a) Encontre as interseções com y=x+1. b) Encontre b para que y=x+b intercepte a parábola em um único ponto. c) Encontre as retas por (1,0) que interceptam a parábola em um único ponto.',
  'lista-2-q49':
    'Considere a parábola P: y=x² e a reta r: ax+by+c=0. a) Para a=2, b=−1 e c=3, determine as interseções. b) Para a=4, b=3 e c=−7, determine o ponto de r mais próximo da origem. c) A=(−1,1), B e C estão na parábola, B no primeiro quadrante, AB paralelo a OC; determine B e C com distância BC=√17.',
};
export const catalog: Question[] = rawCatalog.map(q => ({
  ...q,
  statement: editorial[q.id] ?? q.statement,
}));
export const activityList = [...all, altitudeActivity];
