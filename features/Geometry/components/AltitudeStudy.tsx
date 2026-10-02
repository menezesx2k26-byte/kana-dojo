'use client';
import { useState, type FormEvent } from 'react';
import { Button } from '@/shared/ui/components/button';
import { altitudeActivity as activity } from '../data/altitudeActivity';
import {
  confirmed,
  currentStep,
  completed,
  type Session,
  type LedgerEntry,
} from '../lib/tutor';
import { altitudeVisual, conceptFeedback } from '../lib/concepts';
import { useGeometryStore } from '../store/useGeometryStore';
import { GeometryScene } from './GeometryScene';
import { ConceptComparison } from './ConceptComparison';
import { StudyLedger } from './StudyLedger';
import { StepCalculation } from './StepCalculation';
import { GeometryVisual } from './GeometryVisual';
const id = activity.id;
export function AltitudeStudy({ session }: { session: Session }) {
  const store = useGeometryStore();
  const step = currentStep(id, session),
    verified = confirmed(session),
    done = completed(id, session);
  const vertex = step?.id === 'altura-c' ? 'C' : 'A',
    side = vertex === 'C' ? 'AB' : 'BC',
    intersection = step?.id === 'ortocentro';
  const [progress, setProgress] = useState({
    step: step?.id,
    phase: session.entries.some(e => e.step === step?.id) ? 4 : 0,
  });
  const phase = progress.step === step?.id ? progress.phase : 0;
  const [message, setMessage] = useState(''),
    [compare, setCompare] = useState(false),
    [reset, setReset] = useState(false),
    [clear, setClear] = useState(false);
  const [draft, setDraft] = useState<LedgerEntry | undefined>();
  const [route, setRoute] = useState(session.tool),
    [rationale, setRationale] = useState(session.rationale);
  const visual = altitudeVisual(
    verified,
    done ? 4 : intersection ? 0 : phase,
    vertex,
  );
  const setPhase = (n: number) => {
    setProgress({ step: step?.id, phase: n });
    setMessage('');
    setCompare(false);
    setReset(false);
  };
  function conceptError(text: string, comparison = false) {
    setMessage(text);
    setCompare(comparison);
    store.diagnose(id, step!.id, text, 'conceitual');
  }
  function select(name: string) {
    if (phase === 0) {
      if (name === vertex) {
        setRoute('');
        setRationale('');
        setPhase(1);
      } else
        conceptError(
          `Nesta construção, comece por ${vertex}. Uma altura parte de um vértice.`,
        );
    } else if (phase === 1) {
      if (name === side || name === side.split('').reverse().join(''))
        setPhase(2);
      else
        conceptError(
          `O lado oposto a ${vertex} é o lado que não contém ${vertex}. Observe as extremidades do segmento.`,
        );
    }
  }
  function prepare(event: FormEvent) {
    event.preventDefault();
    store.tool(
      id,
      route,
      rationale.trim().length >= 10
        ? rationale
        : `A altura passa por ${vertex} e é perpendicular a ${side}.`,
    );
    setPhase(4);
  }
  function resetLayer() {
    store.reorient(id);
    setDraft(undefined);
    setProgress({ step: step?.id, phase: 0 });
    setCompare(false);
    setMessage('');
    setReset(true);
  }
  const next = done
    ? 'Revisar a conclusão.'
    : intersection
      ? 'Localizar a interseção das duas alturas já validadas.'
      : phase === 0
        ? `Escolher o vértice ${vertex}.`
        : phase === 1
          ? `Identificar o lado oposto a ${vertex}.`
          : phase === 2
            ? `Reconhecer a perpendicularidade a ${side}.`
            : phase === 3
              ? 'Traduzir 90° em uma relação algébrica.'
              : step?.prompt;
  return (
    <>
      <div className='workspace-top'>
        <div>
          <span className='eyebrow'>
            ESTUDO GUIADO · ALTURA / ORTOCENTRO · DERIVADO
          </span>
          <h1>{activity.title}</h1>
          <p>Um vértice. Um lado oposto. Um ângulo reto.</p>
        </div>
        <Button type='button' variant='ghost' onClick={resetLayer}>
          ↺ RESET
        </Button>
      </div>
      <section className='study-brief' aria-label='Dados e alvo'>
        <div>
          <h2>DADOS</h2>
          <p className='math-givens'>{activity.given.join('   ·   ')}</p>
        </div>
        <div>
          <h2>ALVO</h2>
          <p>{activity.target}</p>
        </div>
      </section>
      <div className='study-grid altitude-study'>
        <div className='canvas-column'>
          <div className='scene-heading'>
            <span className='eyebrow'>
              {done
                ? 'CONCLUSÃO VERIFICADA'
                : intersection
                  ? 'DUAS ALTURAS CONSTRUÍDAS'
                  : phase < 3
                    ? 'VER → RECONHECER'
                    : 'RELAÇÃO → ÁLGEBRA'}
            </span>
            <h2>
              {done
                ? 'O ortocentro está no encontro.'
                : intersection
                  ? 'Onde essas alturas se encontram?'
                  : phase === 0
                    ? `Comece pelo vértice ${vertex}.`
                    : phase === 1
                      ? `Qual é o lado oposto a ${vertex}?`
                      : phase === 2
                        ? 'Qual relação define uma altura?'
                        : `Altura por ${vertex}: vértice + 90°`}
            </h2>
          </div>
          <GeometryScene
            visual={visual}
            onSelect={!done && !intersection && phase < 2 ? select : undefined}
            title={
              done
                ? 'Ortocentro verificado'
                : 'Triângulo ABC: construção de uma altura'
            }
          />
          <p className='scene-caption'>{visual.description}</p>
          {compare ? (
            <ConceptComparison initialMode='median' />
          ) : (
            <details className='comparison-disclosure'>
              <summary>Comparar mediana, altura e mediatriz</summary>
              <ConceptComparison />
            </details>
          )}
          {Object.keys(verified).length > 0 ? (
            <details className='exploration-disclosure'>
              <summary>Explorar as construções validadas</summary>
              <GeometryVisual
                id={id}
                visual={activity.visual}
                validated={verified}
              />
            </details>
          ) : null}
        </div>
        <section
          id='concept-tutor'
          tabIndex={-1}
          className='concept-tutor'
          aria-label='Tutor da relação geométrica'
        >
          <span className='eyebrow'>
            {done
              ? 'RESUMO'
              : intersection
                ? 'RECONHECER O ENCONTRO'
                : phase < 3
                  ? 'RECONHECER A RELAÇÃO'
                  : 'FERRAMENTA'}
          </span>
          {reset ? (
            <div className='notice' role='status'>
              <strong>RESET · Voltar à relação relevante</strong>
              <p>Sabemos: {activity.given.join('; ')}.</p>
              <p>Queremos: {activity.target}</p>
              <p>
                Já validamos:{' '}
                {Object.entries(verified)
                  .map(
                    ([key, value]) =>
                      `${activity.steps.find(s => s.id === key)?.label}: ${value}`,
                  )
                  .join('; ') || 'nenhum resultado intermediário'}
                .
              </p>
              <p>Próximo passo: {next}</p>
            </div>
          ) : null}
          {!done && !intersection && phase === 0 ? (
            <>
              <h3>Uma altura começa em um vértice.</h3>
              <p>
                Toque em {vertex} na figura ou use o botão “Vértice {vertex}”. A
                altura sairá desse ponto.
              </p>
            </>
          ) : null}
          {!done && !intersection && phase === 1 ? (
            <>
              <h3>O lado oposto não contém {vertex}.</h3>
              <p>
                Observe os dois outros vértices. Toque no segmento que os une.
              </p>
            </>
          ) : null}
          {!done && !intersection && phase === 2 ? (
            <>
              <h3>Para ser altura, o que a reta precisa fazer?</h3>
              <p>
                Ela já parte de {vertex}. Falta reconhecer sua relação com{' '}
                {side}.
              </p>
              <div className='relation-choices'>
                <button type='button' onClick={() => setPhase(3)}>
                  Perpendicular · 90°
                </button>
                <button
                  type='button'
                  onClick={() => {
                    const e = conceptFeedback('altitude', 'midpoint');
                    conceptError(e.message, e.compare);
                  }}
                >
                  Passar pelo ponto médio
                </button>
                <button
                  type='button'
                  onClick={() =>
                    conceptError(
                      'Uma paralela não encontra o lado em 90°. A altura precisa ser perpendicular ao lado oposto.',
                    )
                  }
                >
                  Ser paralela
                </button>
              </div>
            </>
          ) : null}
          {!done && !intersection && phase === 3 ? (
            <>
              <h3>Agora os 90° viram álgebra.</h3>
              <p>
                A ferramenta nasce de duas condições: passar por {vertex} e ser
                perpendicular a {side}.
              </p>
              <div className='relation-choices'>
                <button
                  type='button'
                  aria-pressed={route === activity.tools[0]}
                  onClick={() => {
                    setRoute(activity.tools[0]);
                    setRationale(
                      `A altura passa por ${vertex} e é perpendicular a ${side}; o produto das inclinações é −1.`,
                    );
                  }}
                >
                  Inclinações · m_lado × m_altura = −1
                </button>
                <button
                  type='button'
                  aria-pressed={route === activity.tools[1]}
                  onClick={() => {
                    setRoute(activity.tools[1]);
                    setRationale(
                      `A altura passa por ${vertex} e é perpendicular a ${side}; o produto dos vetores diretores é zero.`,
                    );
                  }}
                >
                  Vetores · v_lado · v_altura = 0
                </button>
              </div>
              <p className='input-help'>
                O produto de inclinações vale quando ambas existem. O produto
                escalar dos vetores diretores cobre também direções verticais.
              </p>
              <form onSubmit={prepare}>
                <p className='recognized-relation'>
                  {rationale ||
                    `A altura precisa passar por ${vertex} e ser perpendicular a ${side}.`}
                </p>
                <details className='optional-reflection'>
                  <summary>Acrescentar uma anotação (opcional)</summary>
                  <label htmlFor='concept-rationale'>
                    Por que esta relação encontra a altura?
                  </label>
                  <textarea
                    id='concept-rationale'
                    value={rationale}
                    onChange={e => setRationale(e.target.value)}
                    rows={2}
                    maxLength={1000}
                    placeholder='Explique como entram o vértice e os 90°…'
                  />
                </details>
                <Button
                  type='submit'
                  disabled={!activity.tools.slice(0, 2).includes(route)}
                >
                  Construir a equação
                </Button>
              </form>
            </>
          ) : null}
          {!done && intersection && phase < 4 ? (
            <>
              <h3>Quantas alturas precisamos?</h3>
              <p>
                Duas alturas distintas do ledger já estão prontas. O ortocentro
                é o ponto comum às alturas.
              </p>
              <div className='relation-choices'>
                <button
                  type='button'
                  onClick={() => {
                    store.tool(
                      id,
                      activity.tools[2],
                      'Duas alturas distintas determinam uma interseção; vou resolver e conferir o sistema.',
                    );
                    setPhase(4);
                  }}
                >
                  Duas alturas distintas
                </button>
                <button
                  type='button'
                  onClick={() =>
                    conceptError(
                      conceptFeedback('orthocenter', 'three').message,
                    )
                  }
                >
                  Preciso das três alturas
                </button>
              </div>
            </>
          ) : null}
          {!done && phase === 4 && step ? (
            <>
              <p className='constructed-tool'>
                <strong>FERRAMENTA construída</strong>
                <br />
                {intersection
                  ? 'Sistema das duas alturas validadas'
                  : route || session.tool}
              </p>
              <StepCalculation
                key={step.id}
                id={id}
                session={session}
                step={step}
                initial={draft?.step === step.id ? draft : undefined}
                proofHelp={
                  intersection
                    ? 'Use hC(H)=valor; hA(H)=valor. Substitua H nas duas equações do ledger, escritas com lado esquerdo=0.'
                    : `Use h${vertex}(${vertex})=valor; v_${side}.v_h${vertex}=valor, ou h${vertex}(${vertex})=valor; m_${side}*m_h${vertex}=valor. Calcule com os dados e sua equação escrita como lado esquerdo=0.`
                }
                onOutcome={outcome => {
                  if (outcome.state === 'validado') {
                    setDraft(undefined);
                    requestAnimationFrame(() =>
                      document.getElementById('concept-tutor')?.focus(),
                    );
                    setMessage(
                      'Passo validado. Ele agora pode ser usado no ledger.',
                    );
                    setCompare(false);
                  } else if (outcome.message.includes('mediana')) {
                    setCompare(true);
                  }
                }}
              />
            </>
          ) : null}
          {message ? (
            <div className='feedback' role='status'>
              <p>{message}</p>
            </div>
          ) : null}
          {done ? (
            <div className='completion'>
              <h3>Você construiu o ortocentro.</h3>
              <p className='completion-answer'>H = {verified.ortocentro}</p>
              <p>
                <strong>Decisão:</strong> altura usa o vértice e 90°, sem
                precisar do ponto médio. Duas alturas distintas localizam o
                encontro.
              </p>
              <p>
                O ortocentro fica fora deste triângulo obtusângulo. A equação e
                as substituições, validadas no ledger, sustentam a conclusão.
              </p>
              <p>
                <strong>Para anotar:</strong> {activity.note}
              </p>
              {session.firstDivergence ? (
                <p>
                  <strong>Erro a lembrar:</strong>{' '}
                  {session.firstDivergence.message}{' '}
                  {session.firstDivergence.corrected
                    ? 'Relação corrigida nesta resolução.'
                    : ''}
                </p>
              ) : null}
              <p className='muted'>
                Esta resolução não muda automaticamente seu nível A/B/C/D.
              </p>
            </div>
          ) : null}
        </section>
        <aside className='reference-column'>
          <StudyLedger
            activity={activity}
            session={session}
            onReview={e => {
              store.rewind(id, e.step);
              setDraft(e);
              if (e.step !== 'ortocentro') {
                setRoute(activity.tools[0]);
                store.tool(id, activity.tools[0], session.rationale);
              } else {
                store.tool(id, activity.tools[2], session.rationale);
              }
              setProgress({ step: e.step, phase: 4 });
              setCompare(false);
              setMessage(
                'Etapa reaberta. Os resultados dependentes precisam ser validados novamente.',
              );
            }}
          />
          <details className='reference-details'>
            <summary>Fonte e limites deste treino</summary>
            <p>{activity.reference}</p>
            <p>
              Este treino não é uma questão numerada das listas. O catálogo
              mantém os 79 enunciados originais. O verificador aceita aritmética
              exata e retas lineares equivalentes; não certifica a reflexão em
              português como prova.
            </p>
            <Button
              type='button'
              variant='ghost'
              onClick={() => {
                store.reset(id);
                setDraft(undefined);
                setRoute('');
                setRationale('');
                setProgress({ step: 'altura-c', phase: 0 });
                setMessage('');
                setReset(false);
                setCompare(false);
              }}
            >
              Recomeçar este treino
            </Button>
          </details>
          <div className='local-data'>
            <span>Progresso salvo neste navegador</span>
            <button type='button' onClick={() => setClear(v => !v)}>
              Limpar meus dados
            </button>
            {clear ? (
              <div role='alert'>
                <p>Remover apenas o progresso deste app?</p>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    store.clear();
                    setDraft(undefined);
                    setRoute('');
                    setRationale('');
                    setClear(false);
                    setProgress({ step: 'altura-c', phase: 0 });
                    setMessage('');
                  }}
                >
                  Confirmar limpeza
                </Button>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </>
  );
}
