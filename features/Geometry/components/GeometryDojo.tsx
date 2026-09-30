'use client';
import { useEffect, useState } from 'react';
import { ArrowRight, Compass, Moon, Sun, ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/ui/components/button';
import { activities, activityList, catalog } from '../data/activities';
import { emptySession, completed } from '../lib/tutor';
import { useGeometryStore, hydrateGeometry } from '../store/useGeometryStore';
import { StudyWorkspace } from './StudyWorkspace';
import { AltitudeStudy } from './AltitudeStudy';
const shortName = (id: string) => {
  const q = catalog.find(q => q.id === id)!;
  return `Lista ${q.list} · Q${q.number}`;
};
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
  const activity = activities[store.selected],
    session = store.sessions[store.selected] ?? emptySession();
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
            onClick={() => {
              store.select('altura-ortocentro');
              setView('study');
            }}
          >
            Alturas
          </button>
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
          <span className='live-dot' /> Seu espaço de estudo · conceito antes da
          conta
        </span>
        <span>
          {solved} de {activityList.length} treinos guiados concluídos
        </span>
      </div>
      <main id='main' tabIndex={-1}>
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
            {view === 'study' && activity?.id === 'altura-ortocentro' && (
              <AltitudeStudy session={session} />
            )}
            {view === 'study' &&
              activity &&
              activity.id !== 'altura-ortocentro' && (
                <StudyWorkspace
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
