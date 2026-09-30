'use client';
import { useState } from 'react';
import type { Visual } from '../data/activities';
import { projectToLine, type Vec2 } from '../lib/scene';
import { GeometryScene } from './GeometryScene';
export type ComparisonMode = 'median' | 'altitude' | 'bisector';
export const studyTriangle = [
  { name: 'A', x: 2, y: -1 },
  { name: 'B', x: 0, y: 3 },
  { name: 'C', x: 1, y: 2 },
];
const copy = {
  median: {
    name: 'Mediana',
    signature: 'MEIO',
    meaning: 'Sai de C e chega ao ponto médio de AB.',
    note: 'As duas marcas mostram partes iguais. Não há exigência de 90°.',
  },
  altitude: {
    name: 'Altura',
    signature: '90°',
    meaning: 'Sai de C e encontra o lado oposto AB em ângulo reto.',
    note: 'Ponto médio não define altura. A condição é perpendicularidade.',
  },
  bisector: {
    name: 'Mediatriz',
    signature: 'MEIO + 90°',
    meaning: 'Passa pelo meio de AB e é perpendicular a AB.',
    note: 'Não precisa sair de um vértice. Ela é uma propriedade do segmento AB.',
  },
};
export function comparisonVisual(mode: ComparisonMode): Visual {
  const [a, b, c] = studyTriangle;
  const midpoint = { name: 'M', x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const foot = projectToLine(c, a, b);
  const toward: Vec2 =
    mode === 'bisector'
      ? { x: b.y - a.y, y: a.x - b.x }
      : { x: c.x - foot.x, y: c.y - foot.y };
  const at = mode === 'bisector' ? midpoint : foot;
  return {
    type: 'segment',
    description: `Comparação didática derivada. ${copy[mode].meaning} ${copy[mode].note}`,
    points: mode === 'altitude' ? studyTriangle : [...studyTriangle, midpoint],
    segments: [
      ['A', 'B'],
      ['B', 'C'],
      ['C', 'A'],
    ],
    activeVertex: mode === 'bisector' ? undefined : 'C',
    oppositeSide: ['A', 'B'],
    constructions: [
      mode === 'bisector'
        ? {
            from: midpoint,
            to: { x: midpoint.x + toward.x, y: midpoint.y + toward.y },
            kind: mode,
            infinite: true,
          }
        : { from: c, to: mode === 'median' ? midpoint : foot, kind: mode },
    ],
    rightAngles:
      mode === 'median'
        ? []
        : [{ at, along: { x: a.x - b.x, y: a.y - b.y }, toward }],
    equalMarks:
      mode === 'altitude'
        ? []
        : [
            { a, b: midpoint },
            { a: midpoint, b },
          ],
  };
}
export function ConceptComparison({
  initialMode = 'median',
}: {
  initialMode?: ComparisonMode;
}) {
  const [mode, setMode] = useState<ComparisonMode>(initialMode);
  return (
    <section
      className='concept-comparison'
      aria-label='Comparar mediana, altura e mediatriz'
    >
      <p className='eyebrow'>COMPARAÇÃO DIDÁTICA · DERIVADO</p>
      <div className='comparison-choices' aria-label='Escolher construção'>
        {(Object.keys(copy) as ComparisonMode[]).map(m => (
          <button
            key={m}
            type='button'
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
          >
            <span>{copy[m].name}</span>
            <strong>{copy[m].signature}</strong>
          </button>
        ))}
      </div>
      <GeometryScene
        visual={comparisonVisual(mode)}
        title={`${copy[mode].name}: ${copy[mode].signature}`}
      />
      <div className='comparison-caption' aria-live='polite'>
        <h3>{copy[mode].meaning}</h3>
        <p>{copy[mode].note}</p>
      </div>
    </section>
  );
}
