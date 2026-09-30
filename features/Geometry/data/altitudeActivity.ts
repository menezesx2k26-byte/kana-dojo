import type { Activity, Step, Evidence } from './activities';
import {
  add,
  mul,
  equal,
  scalar,
  parseLine,
  parsePoint,
  onLine,
  sameLine,
  type Linear,
  type Point,
} from '../lib/math';
const residue = (l: Linear, p: Point) =>
  add(add(mul(l.x, p.x), mul(l.y, p.y)), l.c);
const proof = (label: string, value: Evidence['value']): Evidence => ({
  label,
  value,
});
function altitudeStep(vertex: 'C' | 'A'): Step {
  const first = vertex === 'C',
    p = parsePoint(first ? '(1,2)' : '(2,-1)'),
    side = first ? 'AB' : 'BC';
  // The opposite-side direction comes directly from GIVEN endpoints, not a hidden calculated premise.
  const direction = first
    ? { x: scalar(-2), y: scalar(4) }
    : { x: scalar(1), y: scalar(-1) };
  const dot = (l: Linear) =>
    add(mul(direction.x, l.y), mul(direction.y, mul(l.x, scalar(-1))));
  const h = first ? 'hC' : 'hA';
  return {
    id: first ? 'altura-c' : 'altura-a',
    label: `Altura por ${vertex}`,
    kind: 'line',
    requires: first ? [] : ['altura-c'],
    placeholder: 'ax + by + c = 0',
    prompt: `Construa uma equação da altura por ${vertex}. Verifique a passagem por ${vertex} e a perpendicularidade a ${side}.`,
    check: s => onLine(p, parseLine(s)) && equal(dot(parseLine(s)), {}),
    diagnose: s =>
      !onLine(p, parseLine(s))
        ? `A direção pode estar correta, mas a reta não passa pelo vértice ${vertex}. Revise a substituição de ${vertex}, preservando a altura anterior validada.`
        : !equal(dot(parseLine(s)), {})
          ? `A reta passa por ${vertex}, mas não é perpendicular a ${side}. Ponto médio caracteriza a mediana; altura exige 90°. Compare as duas construções e revise a direção.`
          : 'Confira as duas condições da altura.',
    diagnoseKind: s =>
      sameLine(parseLine(s), parseLine(first ? 'x=1' : '7x+3y-11=0'))
        ? 'conceitual'
        : !onLine(p, parseLine(s))
          ? 'algebrico'
          : 'representacao-geometrica',
    evidence: s => [
      [
        proof(`${h}(${vertex})`, residue(parseLine(s), p)),
        proof(`v_${side}.v_${h}`, dot(parseLine(s))),
      ],
      [
        proof(`${h}(${vertex})`, residue(parseLine(s), p)),
        proof(`m_${side}*m_${h}`, scalar(-1)),
      ],
    ],
    hints: [
      `A altura precisa passar por ${vertex} e formar 90° com ${side}. O meio do lado não faz parte dessa definição.`,
      `Para retas não verticais, m_lado · m_altura = −1; por vetores diretores, o produto escalar é zero.`,
      `Use as coordenadas dadas para obter a direção de ${side}; depois imponha a passagem da perpendicular por ${vertex}. Verifique as duas condições na sua equação.`,
    ],
    divergence: `A altura por ${vertex} precisa passar pelo vértice e ser perpendicular ao lado oposto.`,
    decision: `Combinar passagem por ${vertex} com perpendicularidade a ${side}.`,
  };
}
export const altitudeActivity: Activity = {
  id: 'altura-ortocentro',
  title: 'O encontro das alturas',
  given: ['A=(2, −1)', 'B=(0, 3)', 'C=(1, 2)'],
  target: 'Construir duas alturas e localizar o ortocentro do triângulo ABC.',
  tools: [
    'Perpendicularidade + inclinações',
    'Perpendicularidade + vetores diretores',
    'Duas alturas + sistema',
  ],
  reference:
    'Derivado: exercício com coordenadas solicitado no takeover de 30/09/2026. Relações de perpendicularidade e interseção: caderno, pp. 14–15. Definições e comparação geométrica explicitadas como derivação didática.',
  steps: [
    altitudeStep('C'),
    altitudeStep('A'),
    {
      id: 'ortocentro',
      label: 'Ortocentro',
      kind: 'point',
      requires: ['altura-c', 'altura-a'],
      placeholder: '(x, y)',
      prompt:
        'Resolva o sistema das duas alturas do ledger. O ponto H precisa satisfazer as duas equações já validadas.',
      check: (s, a) =>
        onLine(parsePoint(s), parseLine(a['altura-c'])) &&
        onLine(parsePoint(s), parseLine(a['altura-a'])),
      diagnose: (s, a) =>
        !onLine(parsePoint(s), parseLine(a['altura-c']))
          ? 'O ponto ainda não satisfaz a altura por C. Revise essa substituição; as duas alturas do ledger continuam válidas.'
          : 'O ponto satisfaz a altura por C, mas não a altura por A. Revise somente a segunda condição.',
      evidence: (s, a) => [
        [
          proof('hC(H)', residue(parseLine(a['altura-c']), parsePoint(s))),
          proof('hA(H)', residue(parseLine(a['altura-a']), parsePoint(s))),
        ],
      ],
      hints: [
        'Duas alturas distintas já determinam a interseção. A terceira pode conferir o resultado, sem ser pré-requisito.',
        'Use substituição ou eliminação nas equações validadas do ledger.',
        'Depois de encontrar H, substitua suas coordenadas nas duas equações. Só então a figura revela o encontro.',
      ],
      divergence: 'O ortocentro precisa pertencer às duas alturas validadas.',
      decision: 'Encontrar e verificar a interseção de duas alturas distintas.',
    },
  ],
  visual: {
    type: 'intersection',
    exploration: 'triangle-altitudes',
    description:
      'Triângulo ABC. As alturas são construídas progressivamente. Seus trechos finitos evitam revelar a interseção antes do cálculo. H e as retas completas aparecem somente após validação do ortocentro.',
    points: [
      { name: 'A', x: 2, y: -1 },
      { name: 'B', x: 0, y: 3 },
      { name: 'C', x: 1, y: 2 },
      { name: 'H', x: 9, y: 6, revealAfter: 'ortocentro' },
    ],
    segments: [
      ['A', 'B'],
      ['B', 'C'],
      ['C', 'A'],
    ],
    constructions: [
      {
        from: { x: 1, y: 2 },
        to: { x: 0.6, y: 1.8 },
        kind: 'altitude',
        after: 'altura-c',
      },
      {
        from: { x: 2, y: -1 },
        to: { x: 3, y: 0 },
        kind: 'altitude',
        after: 'altura-a',
      },
    ],
    extensions: [
      {
        from: { x: 0, y: 3 },
        to: { x: 3, y: 0 },
        kind: 'projection',
        after: 'altura-a',
      },
    ],
    rightAngles: [
      {
        at: { x: 0.6, y: 1.8 },
        along: { x: 2, y: -4 },
        toward: { x: 0.4, y: 0.2 },
        after: 'altura-c',
      },
      {
        at: { x: 3, y: 0 },
        along: { x: -1, y: 1 },
        toward: { x: -1, y: -1 },
        after: 'altura-a',
      },
    ],
    lines: [
      { equation: 'x-2y+3=0', after: 'ortocentro' },
      { equation: 'x-y-3=0', after: 'ortocentro' },
    ],
  },
  note: 'Altura = vértice + lado oposto + 90°. Mediana usa o meio; mediatriz usa meio e 90°. Duas alturas distintas localizam o ortocentro, que pode ficar fora do triângulo.',
};
