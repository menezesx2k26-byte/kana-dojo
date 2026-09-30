import { Layers, ShieldCheck } from 'lucide-react';
import type { Activity } from '../data/activities';
import { confirmed, type Session, type LedgerEntry } from '../lib/tutor';
export function StudyLedger({
  activity,
  session,
  onReview,
}: {
  activity: Activity;
  session: Session;
  onReview: (entry: LedgerEntry) => void;
}) {
  const verified = confirmed(session);
  return (
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
                <button type='button' onClick={() => onReview(e)}>
                  Revisar esta etapa
                </button>
              )}
            </li>
          ))}
        </ol>
      )}
      <p className='privacy-note'>
        <ShieldCheck size={14} /> Somente resultados validados ou corrigidos
        servem de premissa.
      </p>
    </section>
  );
}
