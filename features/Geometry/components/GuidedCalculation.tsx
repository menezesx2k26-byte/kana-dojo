'use client';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/shared/ui/components/button';
import type { Step } from '../data/activities';
import { guidedPlan } from '../lib/guided';
import { evaluate, type Evaluation, type Session } from '../lib/tutor';
import { useGeometryStore } from '../store/useGeometryStore';

export function GuidedCalculation({
  id,
  step,
  session,
  onOutcome,
}: {
  id: string;
  step: Step;
  session: Session;
  onOutcome?: (outcome: Evaluation) => void;
}) {
  const plan = guidedPlan(id, step, session);
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [outcome, setOutcome] = useState<Evaluation>();
  const heading = useRef<HTMLHeadingElement>(null);
  const store = useGeometryStore();
  useEffect(() => {
    heading.current?.focus();
  }, [index]);
  if (!plan) return <p>Valide a etapa anterior para continuar esta conta.</p>;
  const question = plan.challenges[index];
  const ready = !question;
  const accepted = question && chosen[question.id] === question.correct;
  return (
    <section
      className='guided-calculation'
      aria-label={`Conta guiada: ${step.label}`}
    >
      <div className='guided-heading'>
        <span className='eyebrow'>CONTA GUIADA</span>
        <span>
          {Math.min(index + 1, plan.challenges.length)}/{plan.challenges.length}
        </span>
      </div>
      <div
        className='guided-progress'
        aria-label='Progresso da conta'
        role='progressbar'
        aria-valuenow={index}
        aria-valuemin={0}
        aria-valuemax={plan.challenges.length}
      >
        {plan.challenges.map((c, i) => (
          <span
            key={c.id}
            className={i < index ? 'complete' : i === index ? 'current' : ''}
          />
        ))}
      </div>
      <h3 ref={heading} tabIndex={-1}>
        {ready ? 'Confira o que você construiu.' : question.title}
      </h3>
      {ready ? (
        <>
          <p className='guided-equation'>
            {plan
              .finish(chosen)
              .answer.replace(/sqrt\(([^)]+)\)/g, '√($1)')
              .replace(/\*/g, ' × ')
              .replace(/-/g, '−')}
          </p>
          <p>
            Você escolheu a relação, fez as contas e conferiu as condições.
            Agora registre este passo no ledger.
          </p>
          <Button
            type='button'
            onClick={() => {
              const result = plan.finish(chosen);
              const checked = evaluate(
                id,
                session,
                step,
                result.answer,
                result.evidence,
              );
              setOutcome(checked);
              store.submit(id, result.answer, result.evidence);
              onOutcome?.(checked);
            }}
          >
            Validar e continuar
          </Button>
        </>
      ) : (
        <>
          <p className='guided-equation'>{question.calculation}</p>
          <div
            className='guided-choices'
            role='group'
            aria-label={question.title}
          >
            {question.choices.map(choice => (
              <button
                type='button'
                key={choice.value}
                aria-pressed={chosen[question.id] === choice.value}
                onClick={() => {
                  if (choice.value === question.correct) {
                    setChosen(c => ({ ...c, [question.id]: choice.value }));
                    setMessage('');
                  } else {
                    setChosen(c => {
                      const next = { ...c };
                      delete next[question.id];
                      return next;
                    });
                    setMessage(question.retry);
                    store.diagnose(id, step.id, question.retry, 'algebrico');
                  }
                }}
              >
                {choice.label}
              </button>
            ))}
          </div>
          {accepted ? (
            <div className='guided-success' role='status'>
              <strong>Isso! ✓</strong>
              <p>{question.explanation}</p>
            </div>
          ) : message ? (
            <div className='feedback' role='status'>
              {message}
            </div>
          ) : (
            <p className='input-help'>Escolha uma opção para montar a conta.</p>
          )}
          <div className='tutor-actions'>
            <Button
              type='button'
              disabled={!accepted}
              onClick={() => {
                setIndex(i => i + 1);
                setMessage('');
              }}
            >
              Continuar
            </Button>
            <Button
              type='button'
              variant='ghost'
              onClick={() => store.hint(id, step.id)}
            >
              Uma pista
            </Button>
          </div>
        </>
      )}
      {index > 0 ? (
        <button
          type='button'
          className='guided-back'
          onClick={() => {
            const previous = index - 1;
            setChosen(c =>
              Object.fromEntries(
                Object.entries(c).filter(([key]) =>
                  plan.challenges.slice(0, previous).some(q => q.id === key),
                ),
              ),
            );
            setIndex(previous);
            setMessage('');
            setOutcome(undefined);
          }}
        >
          ← Revisar a conta anterior
        </button>
      ) : null}
      {(session.hints[step.id] ?? 0) > 0 ? (
        <div className='hint-box'>
          <span className='eyebrow'>PISTA · DERIVADO</span>
          <p>{step.hints[(session.hints[step.id] ?? 1) - 1]}</p>
        </div>
      ) : null}
      {outcome && outcome.state !== 'validado' ? (
        <div className='feedback' role='status'>
          {outcome.message}
        </div>
      ) : null}
    </section>
  );
}
