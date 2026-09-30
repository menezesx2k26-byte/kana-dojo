'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  ArrowRight,
  Check,
  Compass,
  BookOpen,
  Moon,
  Sun,
  RotateCcw,
  Lightbulb,
  ShieldCheck,
  ArrowLeft,
  Layers,
} from 'lucide-react';
import { Button } from '@/shared/ui/components/button';
import MasteryBar from '@/shared/ui/components/MasteryBar';
import {
  activities,
  activityList,
  catalog,
  type Activity,
  type Step,
} from '../data/activities';
import {
  emptySession,
  confirmed,
  currentStep,
  completed,
  evaluate,
  type Session,
} from '../lib/tutor';
import { useGeometryStore, hydrateGeometry } from '../store/useGeometryStore';
import { GeometryVisual } from './GeometryVisual';

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
function Workspace({
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
          <section className='ledger-panel' aria-labelledby='ledger-heading'>
            <div className='panel-heading'>
              <div>
                <span className='eyebrow'>04 · SUA MEMÓRIA DE CÁLCULO</span>
                <h2 id='ledger-heading'>LEDGER</h2>
              </div>
              <Layers size={18} />
            </div>
            {!session.entries.length ? (
              <p className='ledger-empty'>
                Cada resultado entra aqui antes de virar o próximo passo.
              </p>
            ) : (
              <ol className='ledger-list'>
                {session.entries.map(e => (
                  <li key={e.step} className={`entry-${e.state}`}>
                    <div>
                      <span className='ledger-label'>
                        {activity.steps.find(s => s.id === e.step)?.label}
                      </span>
                      <span className='ledger-state'>{e.state}</span>
                    </div>
                    <p className='ledger-answer'>{e.answer}</p>
                    <p className='ledger-evidence'>
                      {e.evidence || 'Relação ainda não registrada'}
                    </p>
                    {verified[e.step] && (
                      <button
                        type='button'
                        onClick={() => {
                          store.rewind(activity.id, e.step);
                          setAnswer(e.answer);
                          setEvidence(e.evidence);
                          setFeedback({
                            state: 'calculado',
                            message:
                              'Esta etapa foi reaberta. Os resultados que dependiam dela precisam ser validados novamente.',
                          });
                          answerInput.current?.focus();
                        }}
                      >
                        Revisar esta etapa
                      </button>
                    )}
                  </li>
                ))}
              </ol>
            )}
            <p className='privacy-note'>
              <ShieldCheck size={14} /> Somente resultados validados ou
              corrigidos servem de premissa.
            </p>
          </section>
          <GeometryVisual
            key={activity.id}
            id={activity.id}
            visual={activity.visual}
            validated={verified}
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
export function GeometryDojo() {
  const store = useGeometryStore();
  const [view, setView] = useState<'study' | 'catalog'>('study');
  const [filter, setFilter] = useState(''),
    [list, setList] = useState('todas'),
    [guided, setGuided] = useState(false);
  useEffect(() => {
    void hydrateGeometry();
  }, []);
  const selected = catalog.find(q => q.id === store.selected) ?? catalog[30];
  const activity = activities[selected.id],
    session = store.sessions[selected.id] ?? emptySession();
  const solved = Object.entries(store.sessions).filter(([id, s]) =>
    completed(id, s),
  ).length;
  const questions = catalog.filter(
    q =>
      (list === 'todas' || q.list === +list) &&
      (!guided || !!activities[q.id]) &&
      `${q.topics.join(' ')} ${q.number} ${q.statement}`
        .toLowerCase()
        .includes(filter.toLowerCase()),
  );
  return (
    <div className={`dojo-shell theme-${store.theme}`}>
      <a className='skip-link' href='#main'>
        Ir para a resolução
      </a>
      <header className='dojo-header'>
        <a href='#main' className='brand' onClick={() => setView('study')}>
          <span className='brand-mark'>
            <Compass size={24} />
          </span>
          <span>
            geometria<span className='brand-light'> / dojo</span>
          </span>
          <span className='preview-badge'>PRÉVIA</span>
        </a>
        <nav aria-label='Navegação principal'>
          <button
            type='button'
            className={view === 'study' ? 'active-nav' : ''}
            onClick={() => setView('study')}
          >
            Treinar
          </button>
          <button
            type='button'
            className={view === 'catalog' ? 'active-nav' : ''}
            onClick={() => setView('catalog')}
          >
            As duas listas <span className='nav-count'>79</span>
          </button>
        </nav>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          aria-label={
            store.theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'
          }
          onClick={store.toggleTheme}
        >
          {store.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </Button>
      </header>
      <div className='context-strip'>
        <span>
          <span className='live-dot' /> Seu espaço de estudo · 2 de outubro de
          2026
        </span>
        <span>
          {solved} de {activityList.length} treinos guiados concluídos
        </span>
      </div>
      <main id='main'>
        {!store.hydrated ? (
          <p role='status'>Retomando seu ledger local…</p>
        ) : (
          <>
            {!store.durable && (
              <p className='notice' role='alert'>
                O navegador não permitiu salvar os dados. A resolução continua
                nesta sessão; mantenha uma cópia das suas anotações.
              </p>
            )}
            {view === 'study' && activity && (
              <Workspace
                key={activity.id}
                activity={activity}
                session={session}
              />
            )}
            {view === 'study' && !activity && (
              <section className='unavailable'>
                <button
                  className='back-button'
                  type='button'
                  onClick={() => setView('catalog')}
                >
                  <ArrowLeft size={16} /> Voltar às listas
                </button>
                <span className='eyebrow'>{shortName(selected.id)}</span>
                <h1>
                  {selected.provenance === 'Pendente de fonte'
                    ? 'Primeiro, uma fonte confiável.'
                    : 'Questão catalogada para consulta.'}
                </h1>
                <p>{selected.statement}</p>
                <p className='notice'>
                  {selected.provenance === 'Pendente de fonte'
                    ? 'Esta questão trata de parábolas, que não são desenvolvidas no caderno atual. O treino fica pendente até uma fonte adicional ser aprovada.'
                    : 'O verificador deste exercício ainda está em preparação. Consulte a questão original para a notação e as figuras; o app não atribui uma correção automática a esta questão.'}
                </p>
                <p>
                  Fonte: Lista {selected.list}, Q{selected.number}, p.{' '}
                  {selected.page} · Prof. Leandro Albino Mosca Rodrigues.
                </p>
                <Button
                  onClick={() => {
                    store.select('lista-2-q01');
                    setView('study');
                  }}
                >
                  Abrir um treino guiado <ArrowRight size={16} />
                </Button>
              </section>
            )}
            {view === 'catalog' && (
              <section className='catalog'>
                <div className='catalog-intro'>
                  <span className='eyebrow'>30 QUESTÕES + 49 QUESTÕES</span>
                  <h1>Um mapa para o seu treino.</h1>
                  <p>
                    Escolha pelo conceito ou pelo número original.{' '}
                    {activityList.length} questões já têm tutor e verificação
                    matemática; as demais estão catalogadas para consulta.
                  </p>
                </div>
                <div className='catalog-filters'>
                  <label htmlFor='search'>
                    Buscar por assunto ou número
                    <input
                      id='search'
                      value={filter}
                      onChange={e => setFilter(e.target.value)}
                      placeholder='Ex.: mediana, perpendicular, 15'
                    />
                  </label>
                  <label htmlFor='list'>
                    Lista
                    <select
                      id='list'
                      value={list}
                      onChange={e => setList(e.target.value)}
                    >
                      <option value='todas'>As duas listas</option>
                      <option value='1'>Lista 1 · Coordenadas</option>
                      <option value='2'>Lista 2 · Retas</option>
                    </select>
                  </label>
                  <label className='checkbox-label'>
                    <input
                      type='checkbox'
                      checked={guided}
                      onChange={e => setGuided(e.target.checked)}
                    />{' '}
                    Só treinos guiados
                  </label>
                </div>
                <p className='muted'>{questions.length} questões</p>
                <div className='question-grid'>
                  {questions.map(q => {
                    const a = activities[q.id],
                      s = store.sessions[q.id],
                      state =
                        s && completed(q.id, s)
                          ? 'Concluído'
                          : s?.entries.length
                            ? 'Em andamento'
                            : 'Novo';
                    return (
                      <button
                        className='question-card'
                        type='button'
                        key={q.id}
                        onClick={() => {
                          store.select(q.id);
                          setView('study');
                        }}
                      >
                        <div>
                          <span className='eyebrow'>
                            Lista {q.list} · Q{q.number}
                          </span>
                          <span
                            className={`source-badge ${q.provenance === 'Pendente de fonte' ? 'pending-badge' : ''}`}
                          >
                            {q.provenance}
                          </span>
                        </div>
                        <h2>{a?.title ?? q.topics.join(' / ')}</h2>
                        <p>
                          {q.statement.slice(0, 145)}
                          {q.statement.length > 145 ? '…' : ''}
                        </p>
                        <div className='card-footer'>
                          <span>
                            {a
                              ? `${state} · Treino guiado`
                              : 'Consulta · verificador pendente'}
                          </span>
                          <ArrowRight size={15} />
                        </div>
                        <span className='source-line'>
                          {a
                            ? 'Prática de fundamento'
                            : 'Dificuldade a diagnosticar'}{' '}
                          · p. {q.page}
                          {q.needsFigure ? ' · figura no original' : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <footer className='dojo-footer'>
        <p>
          Construído a partir do{' '}
          <a href='https://github.com/lingdojo/kana-dojo'>Kana Dojo</a> ·
          AGPL-3.0 ·{' '}
          <a
            href={`https://github.com/menezesx2k26-byte/kana-dojo/tree/${process.env.NEXT_PUBLIC_GEOMETRY_SOURCE_SHA ?? 'feat/geometria-analitica-dojo'}`}
          >
            Código-fonte desta versão
          </a>{' '}
          · <a href='/LICENSE.txt'>Licença</a>
        </p>
        <p>Sem conta. Sem IA externa. Suas respostas ficam aqui.</p>
        <details>
          <summary>Sobre o ponto de partida do estudo</summary>
          <p>
            O handoff contém um retrato histórico de setembro de 2026. Seus
            níveis A/B/C/D não foram importados. Antes de personalizar por
            domínio, confirme esse estado com o aluno e use evidências de novas
            resoluções.
          </p>
        </details>
      </footer>
    </div>
  );
}
