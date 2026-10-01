'use client';
import { useState } from 'react';
import { GeometryVisual } from './GeometryVisual';
import {
  comparisonVisual,
  comparisonCopy as copy,
  type ComparisonMode,
} from '../lib/comparison';
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
      <GeometryVisual
        id={`comparacao-${mode}`}
        visual={comparisonVisual(mode)}
        validated={{}}
        title={`${copy[mode].name}: ${copy[mode].signature}`}
        exploreLabel='Arrastar pontos no GeoGebra'
        compact
      />
      <div className='comparison-caption' aria-live='polite'>
        <h3>{copy[mode].meaning}</h3>
        <p>{copy[mode].note}</p>
      </div>
    </section>
  );
}
