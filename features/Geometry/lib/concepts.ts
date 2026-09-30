import { altitudeActivity } from '../data/altitudeActivity';
import type { Visual } from '../data/activities';
import { visibleVisual } from './visual';
export type DiagnosticKind =
  | 'conceitual'
  | 'algebrico'
  | 'notacional'
  | 'interpretacao'
  | 'representacao-geometrica';
export function conceptFeedback(
  concept: 'altitude' | 'bisector' | 'orthocenter',
  choice: string,
) {
  const message =
    concept === 'orthocenter'
      ? 'Duas alturas distintas já determinam a interseção. A terceira pode servir de verificação posterior.'
      : concept === 'bisector'
        ? 'A mediatriz passa pelo meio do segmento e forma 90°. Não precisa sair de um vértice.'
        : 'O ponto médio define a mediana. A altura sai do vértice e forma 90° com o lado oposto. Compare as marcas na figura.';
  return {
    kind: 'conceitual' as const,
    message,
    compare: concept !== 'orthocenter' && choice !== 'parallel',
  };
}
/** No student-entered coordinates enter the drawing. Only validation gates reveal authored objects. */
export function altitudeVisual(
  verified: Record<string, string>,
  phase: number,
  vertex: 'C' | 'A',
): Visual & { constructions: NonNullable<Visual['constructions']> } {
  const base = visibleVisual(altitudeActivity.visual, verified);
  const height = vertex === 'C' ? 'altura-c' : 'altura-a';
  const pending = phase >= 3 && !verified[height] && !verified.ortocentro;
  return {
    ...base,
    activeVertex: phase >= 1 && !verified.ortocentro ? vertex : undefined,
    oppositeSide:
      phase >= 2 && !verified.ortocentro
        ? vertex === 'C'
          ? ['A', 'B']
          : ['B', 'C']
        : undefined,
    constructions: [
      ...(base.constructions ?? []),
      ...(pending
        ? altitudeActivity.visual
            .constructions!.filter(c => c.after === height)
            .map(({ after: _after, ...c }) => c)
        : []),
    ],
    rightAngles: [
      ...(base.rightAngles ?? []),
      ...(pending
        ? altitudeActivity.visual
            .rightAngles!.filter(c => c.after === height)
            .map(({ after: _after, ...c }) => c)
        : []),
    ],
    extensions: [
      ...(base.extensions ?? []),
      ...(pending
        ? altitudeActivity.visual
            .extensions!.filter(c => c.after === height)
            .map(({ after: _after, ...c }) => c)
        : []),
    ],
    description: verified.ortocentro
      ? 'Duas alturas validadas e o ortocentro calculado. O encontro está fora do triângulo.'
      : phase >= 3
        ? `A altura por ${vertex} passa pelo vértice e forma 90° com o lado oposto. A figura ilustra a definição; a equação ainda precisa de prova no ledger.`
        : phase >= 2
          ? `${vertex} é o vértice ativo. O lado oposto é ${vertex === 'C' ? 'AB' : 'BC'}, que não contém esse vértice.`
          : phase >= 1
            ? `O vértice ${vertex} está em destaque. Identifique o lado que não contém ${vertex}.`
            : 'Triângulo ABC com os três vértices dados. Escolha o vértice indicado para começar a construção.',
  };
}
