import { activities, type Step } from '../data/activities';
import { confirmed, type Session } from './tutor';
import {
  add,
  mul,
  scalar,
  parseScalar,
  parsePoint,
  parseLine,
  formatScalar,
  equal,
  type Scalar,
  type Point,
  type Linear,
} from './math';

export interface GuidedChoice {
  value: string;
  label: string;
}
export interface GuidedChallenge {
  id: string;
  title: string;
  calculation: string;
  choices: GuidedChoice[];
  correct: string;
  explanation: string;
  retry: string;
}
export interface GuidedPlan {
  challenges: GuidedChallenge[];
  finish: (chosen: Record<string, string>) => {
    answer: string;
    evidence: string;
  };
}
const neg = (v: Scalar) => mul(v, scalar(-1));
const sub = (a: Scalar, b: Scalar) => add(a, neg(b));
const f = (value: Scalar) =>
  formatScalar(value).replace(/(^|[\s−-])1(?=√)/g, '$1');
const divide = (a: Scalar, b: Scalar) => parseScalar(`(${f(a)})/(${f(b)})`);
const pointText = (p: Point) => `(${f(p.x)}, ${f(p.y)})`;
const dot = (a: Point, b: Point) => add(mul(a.x, b.x), mul(a.y, b.y));
const difference = (a: Point, b: Point): Point => ({
  x: sub(a.x, b.x),
  y: sub(a.y, b.y),
});
const residue = (l: Linear, p: Point) => add(dot(l, p), l.c);
const substitution = (l: Linear, p: Point) =>
  `(${f(l.x)}) × (${f(p.x)}) + (${f(l.y)}) × (${f(p.y)}) + (${f(l.c)})`;
const offset = (variable: string, v: Scalar) =>
  equal(v, {}) ? variable : `${variable} − (${f(v)})`;
function slopeLine(p: Point, m: Scalar, shift = scalar(0)) {
  return `${offset('y', add(p.y, shift))}=(${f(m)})*(${offset('x', p.x)})`;
}

// Stable rotation avoids placing the right answer in the same position every time.
function challenge(
  id: string,
  title: string,
  calculation: string,
  correct: string,
  others: string[],
  explanation: string,
  retry: string,
): GuidedChallenge {
  const values = [...new Set([correct, ...others])];
  const rotation =
    [...id].reduce((n, c) => n + c.charCodeAt(0), 0) % values.length;
  const ordered = [...values.slice(rotation), ...values.slice(0, rotation)];
  return {
    id,
    title,
    calculation,
    correct,
    explanation,
    retry,
    choices: ordered.map(value => ({
      value,
      label: value
        .replace(/sqrt\(([^)]+)\)/g, '√($1)')
        .replace(/\*/g, ' × ')
        .replace(/-/g, '−'),
    })),
  };
}
function number(
  id: string,
  title: string,
  calculation: string,
  value: Scalar,
  explanation: string,
  retry = 'Confira os sinais e a operação mostrada. As etapas anteriores continuam certas.',
): GuidedChallenge {
  const wrong = [
    add(value, scalar(1)),
    neg(value),
    add(value, scalar(2)),
  ].filter(v => !equal(v, value));
  return challenge(
    id,
    title,
    calculation,
    f(value),
    wrong.slice(0, 2).map(f),
    explanation,
    retry,
  );
}

export function guidedPlan(
  id: string,
  step: Step,
  session: Session,
): GuidedPlan | undefined {
  const activity = activities[id];
  if (!activity) return;
  const answers = confirmed(session);
  if (step.requires.some(key => !answers[key])) return;
  const challenges: GuidedChallenge[] = [];
  const known = (name: string): Point => {
    const p = activity.visual.points.find(p => p.name === name)!;
    return { x: parseScalar(String(p.x)), y: parseScalar(String(p.y)) };
  };
  const proof = (answer: string, descriptions: Record<string, string>) => {
    const paths = step.evidence!(answer, answers);
    const path =
      paths.length > 1 && !session.tool.toLowerCase().includes('vetores')
        ? paths[1]
        : paths[0];
    for (const e of path) {
      const slopeProof = e.label.includes('*');
      const perpendicular = e.label.includes('.') || slopeProof;
      const point = e.label.match(/\(([^)]+)\)/)?.[1];
      challenges.push(
        number(
          `proof-${e.label}`,
          perpendicular ? 'Confira os 90°' : `Confira a passagem por ${point}`,
          `${descriptions[e.label]} = ?`,
          e.value,
          perpendicular
            ? slopeProof
              ? 'O produto das inclinações deu −1: as retas são perpendiculares.'
              : 'O produto escalar deu zero: as direções são perpendiculares.'
            : 'A substituição deu zero: o ponto pertence à reta que você construiu.',
        ),
      );
    }
    return (chosen: Record<string, string>) =>
      path.map(e => `${e.label}=${chosen[`proof-${e.label}`]}`).join(';');
  };

  if (step.vectorProof) {
    const { a, b, label } = step.vectorProof;
    const p = known(a),
      q = known(b);
    challenges.push(
      challenge(
        'mean',
        'Como encontrar o meio?',
        `${a}=${pointText(p)} · ${b}=${pointText(q)}`,
        `${label}=(${a}+${b})/2`,
        [`${label}=${a}+${b}`, `${label}=(${a}-${b})/2`],
        'Faça a média das coordenadas, uma de cada vez.',
        'O meio usa a soma dos dois extremos dividida por dois.',
      ),
    );
    for (const axis of ['x', 'y'] as const)
      challenges.push(
        number(
          axis,
          `Calcule a coordenada ${axis}`,
          `(${f(p[axis])} + (${f(q[axis])}))/2 = ?`,
          divide(add(p[axis], q[axis]), scalar(2)),
          `A média das coordenadas ${axis} localiza o meio nesse eixo.`,
        ),
      );
    return {
      challenges,
      finish: c => ({ answer: `(${c.x},${c.y})`, evidence: c.mean }),
    };
  }

  if (step.kind === 'membership') {
    const p = parsePoint(step.id === 'origem' ? '(0,0)' : '(-7,3)');
    const line = parseLine(answers.reta),
      name = step.id === 'origem' ? 'O' : 'T';
    const value = residue(line, p),
      yes = equal(value, {});
    challenges.push(
      number(
        'residue',
        'Substitua as coordenadas',
        `${name}=${pointText(p)} · ${substitution(line, p)} = ?`,
        value,
        'Na equação com lado esquerdo igual a zero, este é o valor da substituição.',
      ),
    );
    challenges.push(
      challenge(
        'belongs',
        'O ponto pertence à reta?',
        `A substituição deu ${f(value)}.`,
        yes ? 'sim' : 'não',
        [yes ? 'não' : 'sim'],
        yes
          ? 'Deu zero: o ponto satisfaz a equação.'
          : 'Deu um valor diferente de zero: o ponto não satisfaz a equação.',
        'Zero significa que pertence. Um valor diferente de zero significa que não pertence.',
      ),
    );
    return {
      challenges,
      finish: c => ({ answer: c.belongs, evidence: `s(${name})=${c.residue}` }),
    };
  }

  if (step.kind === 'scalar') {
    if (id === 'lista-2-q30') {
      const p = known('P'),
        l = parseLine(activity.visual.lines![0].equation);
      const value = residue(l, p),
        abs = parseScalar(f(value).replace(/^-/, ''));
      const norm = dot(l, l);
      challenges.push(
        number(
          'numerator',
          'Calcule o módulo da substituição',
          `|${substitution(l, p)}| = ?`,
          abs,
          'O módulo mantém o numerador não negativo.',
        ),
      );
      challenges.push(
        number(
          'norm',
          'Calcule o quadrado da norma',
          `(${f(l.x)})² + (${f(l.y)})² = ?`,
          norm,
          'A raiz deste valor é o comprimento do vetor normal.',
        ),
      );
      const distance = parseScalar(`(${f(abs)})/sqrt(${f(norm)})`);
      challenges.push(
        number(
          'distance',
          'Monte a distância',
          `${f(abs)}/√(${f(norm)}) = ?`,
          distance,
          'Dividir pela norma transforma o resíduo em comprimento.',
          'Use o módulo no numerador e a raiz da soma dos quadrados no denominador.',
        ),
      );
      return {
        challenges,
        finish: c => ({
          answer: c.distance,
          evidence: `|r(P)|=${c.numerator};a^2+b^2=${c.norm}`,
        }),
      };
    }
    const p = id === 'lista-1-q07' ? parsePoint(answers.medio) : known('P');
    const q = known(id === 'lista-1-q07' ? 'Q' : 'O'),
      d = difference(q, p);
    for (const axis of ['x', 'y'] as const)
      challenges.push(
        number(
          axis,
          `Encontre o deslocamento em ${axis}`,
          `${f(q[axis])} − (${f(p[axis])}) = ?`,
          d[axis],
          'O deslocamento é a diferença entre as coordenadas.',
        ),
      );
    const square = dot(d, d);
    challenges.push(
      number(
        'square',
        'Use Pitágoras',
        `(${f(d.x)})² + (${f(d.y)})² = ?`,
        square,
        'Esta soma é o quadrado do comprimento.',
      ),
    );
    const value = parseScalar(`sqrt(${f(square)})`);
    challenges.push(
      number(
        'distance',
        'Extraia a raiz não negativa',
        `√(${f(square)}) = ?`,
        value,
        'Comprimento é não negativo. A raiz pode ficar em forma exata.',
      ),
    );
    return {
      challenges,
      finish: c => ({ answer: c.distance, evidence: `d^2=${c.square}` }),
    };
  }

  if (step.kind === 'point') {
    const altitude = id === 'altura-ortocentro';
    const first = parseLine(answers[altitude ? 'altura-c' : 'reta']);
    const second = parseLine(altitude ? answers['altura-a'] : 'x+3y=17');
    // These activities have nonzero x coefficients; use the actual validated equations.
    const a = divide(neg(first.y), first.x),
      b = divide(neg(first.c), first.x);
    const c = divide(neg(second.y), second.x),
      d = divide(neg(second.c), second.x);
    const y = divide(sub(d, b), sub(a, c)),
      x = add(mul(a, y), b);
    challenges.push(
      number(
        'y',
        'Iguale as duas expressões de x',
        `x = (${f(a)})y + (${f(b)}) e x = (${f(c)})y + (${f(d)}). Então (${f(sub(a, c))})y = ${f(sub(d, b))}. y = ?`,
        y,
        'O mesmo ponto precisa satisfazer as duas retas. Igualar as expressões elimina x.',
      ),
    );
    challenges.push(
      number(
        'x',
        'Encontre a outra coordenada',
        `x = (${f(a)}) × (${f(y)}) + (${f(b)}) = ?`,
        x,
        'Substitua y em uma das equações validadas.',
      ),
    );
    const p = { x, y },
      answer = pointText(p);
    const path = step.evidence!(answer, answers)[0];
    const evidence = proof(answer, {
      [path[0].label]: substitution(first, p),
      [path[1].label]: substitution(second, p),
    });
    return {
      challenges,
      finish: choices => ({
        answer: `(${choices.x},${choices.y})`,
        evidence: evidence(choices),
      }),
    };
  }

  if (step.kind === 'line') {
    let p: Point,
      direction: Point,
      side: Point | undefined,
      reference: Linear | undefined;
    const altitude = id === 'altura-ortocentro';
    const perpendicular =
      altitude || id === 'lista-2-q15' || id === 'lista-2-q16';
    const vertex = step.id === 'altura-c' ? 'C' : 'A';
    const sideName = step.id === 'altura-c' ? 'AB' : 'BC';
    if (altitude || id === 'lista-2-q16') {
      const names = altitude ? sideName.split('') : ['A', 'B'];
      side = difference(known(names[1]), known(names[0]));
      p = altitude ? known(vertex) : parsePoint(answers.medio);
      direction = { x: neg(side.y), y: side.x };
      reference =
        id === 'lista-2-q16'
          ? parseLine('3x-2y-7=0')
          : { x: neg(side.y), y: side.x, c: {} };
    } else if (id === 'lista-2-q15') {
      reference = parseLine(activity.visual.lines![0].equation);
      side = { x: reference.y, y: neg(reference.x) };
      direction = { x: reference.x, y: reference.y };
      p = known('P');
    } else {
      p = known('A');
      direction = difference(
        id === 'lista-2-q01' ? parsePoint(answers.medio) : known('B'),
        p,
      );
    }
    const vectors =
      session.tool.includes('Vetores') || session.tool.includes('vetores');
    if (perpendicular && side) {
      if (vectors) {
        challenges.push(
          challenge(
            'direction',
            'Escolha uma direção perpendicular',
            `Direção do lado ou da reta dada: ${pointText(side)}. Qual vetor tem produto escalar zero com ela?`,
            pointText(direction),
            [pointText(side), pointText({ x: side.x, y: {} })],
            `${pointText(side)} · ${pointText(direction)} = 0. As direções são perpendiculares.`,
            'O produto escalar precisa ser zero; repetir a direção produz uma paralela.',
          ),
        );
      } else {
        challenges.push(
          number(
            'side-slope',
            'Encontre a inclinação dada',
            `Δy/Δx = (${f(side.y)})/(${f(side.x)}) = ?`,
            divide(side.y, side.x),
            'A inclinação relaciona o deslocamento vertical ao horizontal.',
          ),
        );
        challenges.push(
          number(
            'slope',
            'Transforme 90° em inclinação',
            `m_dada × m_perpendicular = −1. Com m_dada = ${f(divide(side.y, side.x))}, m_perpendicular = ?`,
            divide(direction.y, direction.x),
            'Troque numerador e denominador e inverta o sinal.',
            'Uma perpendicular usa o inverso com sinal oposto. Uma paralela mantém a inclinação.',
          ),
        );
      }
    } else
      challenges.push(
        number(
          'slope',
          'Calcule a inclinação entre os pontos',
          `Δy/Δx = (${f(direction.y)})/(${f(direction.x)}) = ?`,
          divide(direction.y, direction.x),
          'Use a mesma ordem nas duas diferenças.',
        ),
      );
    const m = divide(direction.y, direction.x),
      answer = slopeLine(p, m);
    challenges.push(
      challenge(
        'equation',
        'Monte a equação pelo ponto',
        `A reta passa por ${pointText(p)} e tem inclinação ${f(m)}. Use y − y₀ = m(x − x₀).`,
        answer,
        [slopeLine(p, m, scalar(1)), slopeLine(p, neg(m))],
        'A equação reúne o ponto conhecido e a direção que você encontrou.',
        'Confira o sinal da inclinação e as coordenadas do ponto. Substituir o ponto deve zerar ambos os lados.',
      ),
    );
    const l = parseLine(answer),
      descriptions: Record<string, string> = {};
    if (altitude && side) {
      descriptions[`h${vertex}(${vertex})`] = substitution(l, p);
      descriptions[`v_${sideName}.v_h${vertex}`] =
        `(${f(side.x)}) × (${f(l.y)}) + (${f(side.y)}) × (${f(neg(l.x))})`;
      descriptions[`m_${sideName}*m_h${vertex}`] =
        `(${f(divide(side.y, side.x))}) × (${f(m)})`;
    } else if (perpendicular && reference) {
      descriptions[id === 'lista-2-q16' ? 's(M)' : 's(P)'] = substitution(l, p);
      descriptions[id === 'lista-2-q16' ? 'n_AB.n_s' : 'n_r.n_s'] =
        `(${f(reference.x)}) × (${f(l.x)}) + (${f(reference.y)}) × (${f(l.y)})`;
      if (id === 'lista-2-q15' && side)
        descriptions['m_r*m_s'] = `(${f(divide(side.y, side.x))}) × (${f(m)})`;
    } else {
      descriptions[id === 'lista-2-q01' ? 's(A)' : 'r(A)'] = substitution(l, p);
      descriptions[id === 'lista-2-q01' ? 's(M)' : 'r(B)'] = substitution(
        l,
        id === 'lista-2-q01' ? parsePoint(answers.medio) : known('B'),
      );
    }
    const evidence = proof(answer, descriptions);
    return {
      challenges,
      finish: c => ({ answer: c.equation, evidence: evidence(c) }),
    };
  }
  return;
}
