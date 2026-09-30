'use client';
import { useState } from 'react';
import type { Activity, Step } from '../data/activities';
import type { Session } from '../lib/tutor';
import { conceptFeedback } from '../lib/concepts';
import { useGeometryStore } from '../store/useGeometryStore';
import { ConceptComparison } from './ConceptComparison';
function lesson(activity: Activity, step: Step) {
  if (activity.id === 'lista-2-q16')
    return {
      question: 'Quais condições definem a mediatriz?',
      right: 'Meio do segmento + 90°',
      wrong: 'Sair de um vértice',
      meaning:
        'A mediatriz passa pelo meio e é perpendicular ao segmento. A passagem por um vértice não faz parte da definição.',
      concept: 'bisector' as const,
    };
  if (step.vectorProof) {
    const side = step.vectorProof.a + step.vectorProof.b;
    return {
      question:
        activity.id === 'lista-1-q07'
          ? 'Onde a mediana encontra o lado oposto?'
          : 'Que ponto oferece o segundo ponto da reta?',
      right: `O meio de ${side}`,
      wrong: 'Uma perpendicular, sem considerar o meio',
      meaning: `As duas partes de ${side} precisam ser iguais. A média das coordenadas traduz essa relação.`,
      concept: 'midpoint' as const,
    };
  }
  if (activity.id === 'lista-2-q15' || activity.id === 'lista-2-q30')
    return {
      question:
        activity.id === 'lista-2-q15'
          ? 'Que relação define a reta pedida?'
          : 'Que direção dá a menor distância até a reta?',
      right: 'Perpendicular · 90°',
      wrong: 'Passar pelo ponto médio',
      meaning:
        activity.id === 'lista-2-q15'
          ? 'A reta pedida passa por P e é perpendicular à reta r. O ponto médio não define essa reta. Os 90° viram produto escalar zero ou, quando ambas existem, produto das inclinações −1.'
          : 'O caminho mais curto de P até a reta r é perpendicular a r. O ponto médio não define esse caminho. Usamos a projeção perpendicular ou a fórmula da distância ponto-reta.',
      concept: 'perpendicular' as const,
    };
  if (step.kind === 'membership')
    return {
      question: 'Como decidir se o ponto pertence à reta?',
      right: 'Substituir o ponto na equação',
      wrong: 'Apenas olhar a figura',
      meaning:
        'Na equação escrita como lado esquerdo=0, a substituição precisa dar zero. A aparência da figura apoia, mas não prova a pertinência.',
      concept: 'membership' as const,
    };
  if (step.id === 'intersecao')
    return {
      question: 'O que caracteriza o encontro das retas?',
      right: 'Satisfazer as duas equações',
      wrong: 'Pertencer a apenas uma reta',
      meaning:
        'A interseção satisfaz simultaneamente as duas equações. O sistema traduz essa condição.',
      concept: 'intersection' as const,
    };
  if (step.kind === 'line')
    return {
      question: 'O que determina a reta pedida?',
      right: 'Passar pelos dois pontos conhecidos',
      wrong: 'Passar por apenas um dos pontos',
      meaning:
        'Dois pontos distintos determinam uma reta. Determinante ou inclinação são formas de traduzir a mesma relação.',
      concept: 'line' as const,
    };
  return {
    question: 'Que relação dá o comprimento do segmento?',
    right: 'Pitágoras nos deslocamentos horizontal e vertical',
    wrong: 'Somar as coordenadas dos pontos',
    meaning:
      'Os deslocamentos são catetos de um triângulo retângulo. A soma de seus quadrados dá o quadrado da distância.',
    concept: 'distance' as const,
  };
}
export function RelationTutor({
  activity,
  step,
  session,
  recognized,
  onRecognize,
}: {
  activity: Activity;
  step: Step;
  session: Session;
  recognized: boolean;
  onRecognize: (ready: boolean) => void;
}) {
  const tool = useGeometryStore(s => s.tool),
    diagnose = useGeometryStore(s => s.diagnose);
  const [message, setMessage] = useState(''),
    [compare, setCompare] = useState(false);
  const l = lesson(activity, step);
  return (
    <div className='relation-tutor'>
      {!recognized ? (
        <>
          <h3>{l.question}</h3>
          <p>
            Observe os dados e a construção na figura. Primeiro a relação;
            depois a ferramenta.
          </p>
          <div className='relation-choices'>
            <button
              type='button'
              onClick={() => {
                onRecognize(true);
                setMessage('');
                setCompare(false);
              }}
            >
              {l.right}
            </button>
            <button
              type='button'
              onClick={() => {
                const feedback =
                  l.concept === 'bisector'
                    ? conceptFeedback('bisector', 'vertex')
                    : { message: l.meaning, compare: false };
                setMessage(feedback.message);
                setCompare(feedback.compare);
                diagnose(activity.id, step.id, feedback.message, 'conceitual');
              }}
            >
              {l.wrong}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className='recognized-relation'>{l.meaning}</p>
          <div
            className='relation-choices'
            aria-label='Ferramentas para esta relação'
          >
            {activity.tools.map(t => (
              <button
                key={t}
                type='button'
                aria-pressed={session.tool === t}
                onClick={() => tool(activity.id, t, session.rationale)}
              >
                {t}
              </button>
            ))}
          </div>
          <label htmlFor='rationale'>
            Como esta relação aproxima você do alvo?
          </label>
          <textarea
            id='rationale'
            rows={2}
            maxLength={1000}
            value={session.rationale}
            onChange={e => tool(activity.id, session.tool, e.target.value)}
            placeholder='Explique como a relação geométrica conduz ao cálculo…'
          />
        </>
      )}
      {message ? (
        <div className='feedback' role='status'>
          {message}
        </div>
      ) : null}
      {compare ? <ConceptComparison initialMode='bisector' /> : null}
    </div>
  );
}
