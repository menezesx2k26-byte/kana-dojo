'use client';
import { useRef, useState, type FormEvent } from 'react';
import {
  ArrowRight,
  Check,
  Compass,
  BookOpen,
  RotateCcw,
  Lightbulb,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/shared/ui/components/button';
import MasteryBar from '@/shared/ui/components/MasteryBar';
import {
  activityList,
  catalog,
  type Activity,
  type Step,
} from '../data/activities';
import {
  confirmed,
  currentStep,
  completed,
  evaluate,
  type Session,
} from '../lib/tutor';
import { useGeometryStore } from '../store/useGeometryStore';
import { GeometryVisual } from './GeometryVisual';
import { StudyLedger } from './StudyLedger';

const shortName = (id: string) => {
  const q = catalog.find(q => q.id === id)!;
  return `Lista ${q.list} · Q${q.number}`;
};
function proofInstructions(activity: Activity, step: Step): string {
  if (step.vectorProof) {
    const { label, a, b } = step.vectorProof;
    return `Escreva ${label}=uma combinação de ${a} e ${b}. Ex.: ${label}=(${a}+${b})/2. Outras formas equivalentes também valem.`;
  }
  if (activity.id === 'lista-2-q15')
    return 'Use m_r*m_s=valor; s(P)=valor ou n_r.n_s=valor; s(P)=valor. O ponto indica produto escalar dos vetores normais.';
  if (activity.id === 'lista-2-q16')
    return 'Use s(M)=valor; n_AB.n_s=valor. O produto escalar dos vetores normais verifica a perpendicularidade.';
  if (activity.id === 'lista-2-q30')
    return 'Use |r(P)|=valor; a^2+b^2=valor. Registre o módulo do resíduo e o quadrado da norma.';
  if (step.id === 'reta' && activity.id === 'lista-2-q04')
    return 'Use r(A)=valor; r(B)=valor. Calcule cada substituição na sua equação escrita como lado esquerdo=0.';
  if (step.id === 'reta')
    return 'Use s(A)=valor; s(M)=valor. Substitua cada ponto no lado esquerdo da sua equação escrita como lado esquerdo=0.';
  if (step.id === 'intersecao')
    return 'Use r(P)=valor; s(P)=valor. Para s, use x+3y−17=0; para r, use sua equação do ledger.';
  if (step.kind === 'membership')
    return `Use s(${step.id === 'origem' ? 'O' : 'T'})=valor. Calcule o resíduo na sua equação, escrita como lado esquerdo=0.`;
  return 'Use d^2=valor. Você pode digitar a soma dos quadrados das diferenças ou o resultado exato dessa soma.';
}
export function StudyWorkspace({
  activity,
  session,
}: {
  activity: Activity;
  session: Session;
}) {
  const store = useGeometryStore();
  const [answer, setAnswer] = useState(''),
    [evidence, setEvidence] = useState('');
  const [feedback, setFeedback] = useState<{
    message: string;
    state: string;
  } | null>(null);
  const [resetOpen, setResetOpen] = useState(false),
    [clearOpen, setClearOpen] = useState(false);
  const answerInput = useRef<HTMLInputElement>(null);
  const verified = confirmed(session),
    step = currentStep(activity.id, session),
    done = completed(activity.id, session);
  const stepIndex = step
    ? activity.steps.findIndex(s => s.id === step.id)
    : activity.steps.length;
  function send(event: FormEvent) {
    event.preventDefault();
    if (!step) return;
    const outcome = evaluate(activity.id, session, step, answer, evidence);
    setFeedback(outcome);
    store.submit(activity.id, answer, evidence);
    if (outcome.state === 'validado') {
      setAnswer('');
      setEvidence('');
      answerInput.current?.focus();
    }
  }
  const question = catalog.find(q => q.id === activity.id)!;
  return (
    <>
      <div className='workspace-top'>
        <div>
          <span className='eyebrow'>
            {shortName(activity.id)} · {question.topics.join(' / ')}
          </span>
          <h1>{activity.title}</h1>
          <p>Conceito primeiro. Conta depois.</p>
        </div>
        <Button
          variant='ghost'
          type='button'
          onClick={() => setResetOpen(v => !v)}
        >
          <RotateCcw size={16} /> RESET
        </Button>
      </div>
      <div className='study-grid'>
        <div className='canvas-column'>
          <GeometryVisual
            key={activity.id}
            id={activity.id}
            visual={activity.visual}
            validated={verified}
          />
        </div>
        <div className='resolution-column'>
          <section className='statement-panel'>
            <div className='panel-heading'>
              <span className='eyebrow'>O PROBLEMA</span>
              <span className='source-badge'>No material</span>
            </div>
            <p className='statement'>{question.statement}</p>
            <p className='source-line'>
              Prof. Leandro Albino Mosca Rodrigues · Lista {question.list}, p.{' '}
              {question.page}
            </p>
          </section>
          <section
            className='protocol-panel'
            aria-label='Dados, alvo e ferramenta'
          >
            <div>
              <h2>
                <span className='protocol-number'>01</span> DADOS
              </h2>
              <ul className='given-list'>
                {activity.given.map(g => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </div>
            <div>
              <h2>
                <span className='protocol-number'>02</span> ALVO
              </h2>
              <p>{activity.target}</p>
            </div>
            <div>
              <h2>
                <span className='protocol-number'>03</span> FERRAMENTA
              </h2>
              <label className='sr-only' htmlFor='tool'>
                Ferramenta escolhida
              </label>
              <select
                id='tool'
                value={session.tool}
                onChange={e =>
                  store.tool(activity.id, e.target.value, session.rationale)
                }
              >
                <option value=''>Escolha seu caminho</option>
                {activity.tools.map(t => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <label htmlFor='rationale' className='small-label'>
                Por que esse caminho serve ao alvo?
              </label>
              <textarea
                id='rationale'
                rows={2}
                maxLength={1000}
                placeholder='Explique a relação que você pretende usar…'
                value={session.rationale}
                onChange={e =>
                  store.tool(activity.id, session.tool, e.target.value)
                }
              />
            </div>
          </section>
          {resetOpen && (
            <section className='notice'>
              <h2>RESET · De volta ao próximo passo</h2>
              <p>
                Sabemos: {activity.given.join('; ')}. Queremos:{' '}
                {activity.target}
              </p>
              <p>
                Já validamos:{' '}
                {Object.keys(verified).length
                  ? session.entries
                      .filter(e => verified[e.step])
                      .map(e => `${e.step}: ${e.answer}`)
                      .join('; ')
                  : 'nenhum resultado intermediário'}
                .
              </p>
              <p>
                Próximo passo:{' '}
                {step?.prompt ?? 'revisar o resumo da resolução concluída'}.
              </p>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  store.reset(activity.id);
                  setAnswer('');
                  setEvidence('');
                  setFeedback(null);
                  setResetOpen(false);
                }}
              >
                Limpar esta resolução e recomeçar
              </Button>
            </section>
          )}
          <section className='tutor-panel' aria-labelledby='tutor-heading'>
            <div className='panel-heading'>
              <div className='tutor-label'>
                <span className='tutor-icon'>
                  <Compass size={19} />
                </span>
                <div>
                  <span className='eyebrow'>SEU TUTOR</span>
                  <h2 id='tutor-heading'>
                    {done
                      ? 'O raciocínio está fechado.'
                      : 'Qual é o próximo passo?'}
                  </h2>
                </div>
              </div>
              <span className='muted step-count'>
                {Math.min(stepIndex + 1, activity.steps.length)}/
                {activity.steps.length}
              </span>
            </div>
            <div
              className='step-progress'
              role='progressbar'
              aria-label='Etapas verificadas'
              aria-valuenow={stepIndex}
              aria-valuemin={0}
              aria-valuemax={activity.steps.length}
            >
              <MasteryBar
                percent={(stepIndex / activity.steps.length) * 100}
                height='h-1'
              />
            </div>
            {step && (
              <>
                <h3>{step.label}</h3>
                <p className='tutor-question'>{step.prompt}</p>
                <form onSubmit={send}>
                  <label htmlFor='answer'>Seu resultado</label>
                  <input
                    id='answer'
                    ref={answerInput}
                    autoComplete='off'
                    maxLength={160}
                    placeholder={step.placeholder}
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    aria-describedby='notation'
                    required
                  />
                  <p id='notation' className='input-help'>
                    Frações, decimais exatos e radicais: 1/2, 0.5, sqrt(2)/3.
                    Para coordenadas com vírgula decimal, use ponto e vírgula
                    entre x e y.
                  </p>
                  <label htmlFor='evidence'>A relação que justifica</label>
                  <textarea
                    id='evidence'
                    rows={2}
                    maxLength={500}
                    autoComplete='off'
                    placeholder='Registre a verificação matemática…'
                    value={evidence}
                    onChange={e => setEvidence(e.target.value)}
                    aria-describedby='proof-help'
                  />
                  <p id='proof-help' className='input-help'>
                    {proofInstructions(activity, step)}
                  </p>
                  <div className='tutor-actions'>
                    <Button type='submit'>
                      <Check size={16} /> Verificar passo
                    </Button>
                    <Button
                      variant='ghost'
                      type='button'
                      onClick={() => store.hint(activity.id, step.id)}
                    >
                      <Lightbulb size={16} /> Uma pista
                    </Button>
                  </div>
                </form>
                {(session.hints[step.id] ?? 0) > 0 && (
                  <div className='hint-box'>
                    <span className='eyebrow'>
                      PISTA {session.hints[step.id]}/3 · Derivado
                    </span>
                    <p>{step.hints[(session.hints[step.id] ?? 1) - 1]}</p>
                  </div>
                )}
              </>
            )}
            {feedback && (
              <div
                className={`feedback feedback-${feedback.state}`}
                role='status'
              >
                <strong>
                  {feedback.state === 'ambigua'
                    ? 'Vamos esclarecer, sem penalidade'
                    : feedback.state === 'calculado'
                      ? 'Resultado correto · justificativa pendente'
                      : feedback.state === 'validado'
                        ? 'Passo validado'
                        : feedback.state === 'bloqueada'
                          ? 'Antes de avançar'
                          : 'Vamos revisar este ponto'}
                </strong>
                <p>{feedback.message}</p>
              </div>
            )}
            {done && (
              <div className='completion'>
                <span className='success-icon'>
                  <Check size={26} />
                </span>
                <h3>Você construiu a solução.</h3>
                <p>
                  <strong>Conceito:</strong> {question.topics.join(', ')}.
                </p>
                <p>
                  <strong>Decisão principal:</strong>{' '}
                  {activity.steps.map(s => s.decision).join(' ')}
                </p>
                <p>
                  <strong>Resultado:</strong>{' '}
                  {session.entries
                    .map(
                      e =>
                        `${activity.steps.find(s => s.id === e.step)?.label}: ${e.answer}`,
                    )
                    .join('; ')}
                  .
                </p>
                <p>
                  <strong>Para anotar:</strong> {activity.note}
                </p>
                {session.firstDivergence && (
                  <p>
                    <strong>Erro a lembrar:</strong>{' '}
                    {session.firstDivergence.message}
                  </p>
                )}
                <p className='muted'>
                  Esta resolução é evidência de estudo. Ela não muda
                  automaticamente seu nível A/B/C/D.
                </p>
                <Button
                  type='button'
                  onClick={() => {
                    const next =
                      activityList[
                        (activityList.findIndex(a => a.id === activity.id) +
                          1) %
                          activityList.length
                      ];
                    store.select(next.id);
                  }}
                >
                  Treinar outra relação <ArrowRight size={16} />
                </Button>
              </div>
            )}
          </section>
        </div>
        <aside className='reference-column'>
          <StudyLedger
            activity={activity}
            session={session}
            onReview={e => {
              store.rewind(activity.id, e.step);
              setAnswer(e.answer);
              setEvidence(e.evidence);
              setFeedback({
                state: 'calculado',
                message:
                  'Esta etapa foi reaberta. Seus dependentes precisam ser validados novamente.',
              });
              answerInput.current?.focus();
            }}
          />
          <details className='reference-details'>
            <summary>
              <BookOpen size={16} /> Referência e limites do verificador
            </summary>
            <p>
              {activity.reference}. As fontes originais prevalecem sobre o
              formulário e o guia visual.
            </p>
            <p>{activity.note}</p>
            <p>
              Verificador exato de aritmética racional, raízes quadradas
              numéricas e equações lineares em x e y. Não aceita funções gerais,
              produtos de variáveis ou álgebra simbólica irrestrita.
              Aproximações que não sejam exatamente equivalentes pedem revisão;
              não há tolerância oculta.
            </p>
            <p>
              A explicação da ferramenta fica registrada como reflexão. A
              autoridade matemática são as condições verificadas e as relações
              do ledger.
            </p>
          </details>
          <div className='local-data'>
            <span>
              <ShieldCheck size={16} /> Progresso salvo neste navegador
            </span>
            <button type='button' onClick={() => setClearOpen(v => !v)}>
              Limpar meus dados
            </button>
            {clearOpen && (
              <div role='alert'>
                <p>
                  Isso remove apenas o progresso deste app. Outras aplicações
                  não são afetadas.
                </p>
                <Button
                  variant='outline'
                  type='button'
                  onClick={() => {
                    store.clear();
                    setAnswer('');
                    setEvidence('');
                    setFeedback(null);
                    setClearOpen(false);
                  }}
                >
                  Confirmar limpeza
                </Button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
