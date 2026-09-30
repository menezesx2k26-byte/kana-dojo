import type { DiagnosticKind } from './concepts';
import { activities, type Step } from '../data/activities';
import {
  parseLine,
  parsePoint,
  parseScalar,
  parseExpression,
  equal,
  type Scalar,
} from './math';
export interface LedgerEntry {
  step: string;
  answer: string;
  evidence: string;
  state: 'proposto' | 'calculado' | 'validado' | 'corrigido';
  message: string;
  establishedAt: string;
}
export interface Session {
  entries: LedgerEntry[];
  tool: string;
  rationale: string;
  hints: Record<string, number>;
  firstDivergence?: {
    step: string;
    message: string;
    corrected: boolean;
    kind?: DiagnosticKind;
  };
}
export interface Evaluation {
  kind?: DiagnosticKind;
  state: LedgerEntry['state'] | 'ambigua' | 'incompativel' | 'bloqueada';
  message: string;
}
export const emptySession = (): Session => ({
  entries: [],
  tool: '',
  rationale: '',
  hints: {},
});
export function confirmed(session: Session): Record<string, string> {
  return Object.fromEntries(
    session.entries
      .filter(e => e.state === 'validado' || e.state === 'corrigido')
      .map(e => [e.step, e.answer]),
  );
}
export function currentStep(id: string, session: Session): Step | undefined {
  const answers = confirmed(session);
  return activities[id]?.steps.find(s => !answers[s.id]);
}
export function completed(id: string, session: Session): boolean {
  return (
    !!activities[id] &&
    activities[id].steps.every(s => !!confirmed(session)[s.id])
  );
}
function evidenceValid(
  step: Step,
  answer: string,
  evidence: string,
  answers: Record<string, string>,
): boolean {
  if (step.vectorProof) {
    const { label, a, b, weightA, weightB } = step.vectorProof;
    const parts = evidence.split('=');
    if (parts.length !== 2 || parts[0].trim().toUpperCase() !== label)
      throw new Error(`Use ${label}=uma expressão com ${a} e ${b}.`);
    const expression = parts[1]
      .replace(new RegExp(`\\b${a}\\b`, 'gi'), 'x')
      .replace(new RegExp(`\\b${b}\\b`, 'gi'), 'y');
    const v = parseExpression(expression);
    return (
      equal(v.c, {}) &&
      equal(v.x, parseScalar(weightA)) &&
      equal(v.y, parseScalar(weightB))
    );
  }
  const paths = step.evidence?.(answer, answers) ?? [];
  const terms = evidence
    .split(';')
    .map(p => p.trim())
    .filter(Boolean);
  const parsed: Record<string, Scalar> = {};
  for (const term of terms) {
    const pieces = term.split('=');
    if (pieces.length !== 2)
      throw new Error(
        'Registre cada relação como nome=valor; separe relações com ponto e vírgula.',
      );
    const key = pieces[0].replace(/\s/g, '').toLowerCase();
    if (parsed[key]) throw new Error('Há uma relação repetida.');
    parsed[key] = parseScalar(pieces[1]);
  }
  return paths.some(
    path =>
      Object.keys(parsed).length === path.length &&
      path.every(
        e =>
          parsed[e.label.toLowerCase()] &&
          equal(parsed[e.label.toLowerCase()], e.value),
      ),
  );
}
export function evidenceFormat(step: Step): string {
  if (step.vectorProof) {
    const { label, a, b } = step.vectorProof;
    return `${label}=uma expressão com ${a} e ${b}`;
  }
  const fakeExamples: Record<string, string> = {
    reta: 's(A)=valor; s(M)=valor',
    origem: 's(O)=valor',
    teste: 's(T)=valor',
    intersecao: 'r(P)=valor; s(P)=valor',
    distancia: 'd^2=valor',
  };
  return fakeExamples[step.id] ?? 'relação=valor';
}
export function evaluate(
  id: string,
  session: Session,
  step: Step,
  answer: string,
  evidence: string,
): Evaluation {
  const answers = confirmed(session);
  const next = currentStep(id, session);
  if (next?.id !== step.id || step.requires.some(k => !answers[k]))
    return {
      state: 'bloqueada',
      kind: 'interpretacao',
      message:
        'Valide os passos anteriores antes de usar esses resultados como premissas.',
    };
  if (!session.tool || session.rationale.trim().length < 10)
    return {
      state: 'bloqueada',
      kind: 'interpretacao',
      message:
        'Registre a ferramenta e explique por que ela aproxima você do alvo.',
    };
  try {
    if (step.kind === 'point') parsePoint(answer);
    else if (step.kind === 'line') parseLine(answer);
    else if (step.kind === 'scalar') parseScalar(answer);
    else if (
      !/^(sim|não|nao|pertence|não pertence|nao pertence)$/i.test(answer.trim())
    )
      throw new Error('Esclareça a conclusão com sim ou não.');
    if (!step.check(answer, answers)) {
      return {
        state: 'incompativel',
        kind:
          step.diagnoseKind?.(answer, answers) ??
          (step.kind === 'membership' ? 'interpretacao' : 'algebrico'),
        message: step.diagnose?.(answer, answers) ?? step.divergence,
      };
    }
    if (!evidence.trim())
      return {
        state: 'calculado',
        message:
          'Resultado matematicamente correto. Falta justificar a relação indicada; ele permanece calculado, sem virar premissa confirmada.',
      };
    if (!evidenceValid(step, answer, evidence, answers))
      return {
        state: 'calculado',
        message:
          'O resultado está correto; a primeira divergência está na justificativa. Confira a relação e os valores usando seus dados e sua equação.',
      };
    return {
      state: 'validado',
      message:
        'Resultado e relação verificados. Este passo agora pode ser usado no ledger.',
    };
  } catch (error) {
    return {
      state: 'ambigua',
      kind: 'notacional',
      message:
        error instanceof Error
          ? error.message
          : 'Esclareça a notação para continuar. Sua tentativa não foi penalizada.',
    };
  }
}
export function submit(
  id: string,
  session: Session,
  answer: string,
  evidence: string,
  now = new Date().toISOString(),
): Session {
  const step = currentStep(id, session);
  if (!step) return session;
  const result = evaluate(id, session, step, answer, evidence);
  if (result.state === 'ambigua' || result.state === 'bloqueada')
    return session;
  const firstDivergence =
    session.firstDivergence ??
    (result.state === 'incompativel' ||
    (result.state === 'calculado' && !!evidence.trim())
      ? {
          step: step.id,
          message: result.message,
          corrected: false,
          kind: result.kind ?? 'algebrico',
        }
      : undefined);
  const fixed =
    result.state === 'validado' && firstDivergence?.step === step.id;
  const entry: LedgerEntry = {
    step: step.id,
    answer,
    evidence,
    state: fixed
      ? 'corrigido'
      : result.state === 'incompativel'
        ? 'proposto'
        : result.state,
    message: result.message,
    establishedAt: now,
  };
  return {
    ...session,
    entries: [...session.entries.filter(e => e.step !== step.id), entry],
    firstDivergence: firstDivergence
      ? { ...firstDivergence, corrected: fixed || firstDivergence.corrected }
      : undefined,
  };
}
export function resetLayer(id: string, session: Session): Session {
  const step = currentStep(id, session);
  const hints = { ...session.hints };
  if (step) delete hints[step.id];
  return {
    ...session,
    entries: session.entries.filter(
      e => e.state === 'validado' || e.state === 'corrigido',
    ),
    hints,
  };
}
export function rewind(id: string, session: Session, stepId: string): Session {
  const index = activities[id].steps.findIndex(s => s.id === stepId);
  const preserve = new Set(activities[id].steps.slice(0, index).map(s => s.id));
  return {
    ...session,
    entries: session.entries.filter(e => preserve.has(e.step)),
    firstDivergence:
      session.firstDivergence && preserve.has(session.firstDivergence.step)
        ? session.firstDivergence
        : undefined,
  };
}
export function validateStoredSession(
  id: string,
  unknownValue: unknown,
): Session {
  const clean = emptySession();
  if (!activities[id] || !unknownValue || typeof unknownValue !== 'object')
    return clean;
  const stored = unknownValue as Partial<Session>;
  clean.tool =
    typeof stored.tool === 'string' &&
    activities[id].tools.includes(stored.tool)
      ? stored.tool
      : '';
  clean.rationale =
    typeof stored.rationale === 'string' ? stored.rationale.slice(0, 1000) : '';
  if (!Array.isArray(stored.entries)) return clean;
  const diagnostic = stored.firstDivergence;
  if (
    diagnostic &&
    activities[id].steps.some(s => s.id === diagnostic.step) &&
    typeof diagnostic.message === 'string'
  ) {
    // A historical diagnostic is descriptive; only the replay below establishes validity.
    clean.firstDivergence = {
      step: diagnostic.step,
      message: diagnostic.message.slice(0, 500),
      corrected: false,
      kind: diagnostic.kind,
    };
  }
  // Re-run the mathematical authority on hydration. Never trust a stored status.
  let result = clean;
  for (const entry of stored.entries.slice(0, activities[id].steps.length)) {
    if (
      !entry ||
      typeof entry.answer !== 'string' ||
      typeof entry.evidence !== 'string' ||
      currentStep(id, result)?.id !== entry.step
    )
      break;
    result = submit(
      id,
      result,
      entry.answer.slice(0, 160),
      entry.evidence.slice(0, 500),
      typeof entry.establishedAt === 'string'
        ? entry.establishedAt
        : 'restaurado',
    );
  }
  if (stored.hints && typeof stored.hints === 'object')
    result.hints = Object.fromEntries(
      Object.entries(stored.hints)
        .filter(
          ([key, n]) =>
            activities[id].steps.some(s => s.id === key) &&
            typeof n === 'number',
        )
        .map(([key, n]) => [key, Math.max(0, Math.min(3, n))]),
    );
  return result;
}
