'use client';
import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Button } from '@/shared/ui/components/button';
import type { Step } from '../data/activities';
import { evaluate, type Session, type Evaluation } from '../lib/tutor';
import { useGeometryStore } from '../store/useGeometryStore';
import { GuidedCalculation } from './GuidedCalculation';
export function StepCalculation({
  id,
  step,
  session,
  proofHelp,
  onOutcome,
  initial,
}: {
  id: string;
  step: Step;
  session: Session;
  proofHelp: string;
  initial?: { answer: string; evidence: string };
  onOutcome?: (outcome: Evaluation) => void;
}) {
  const submit = useGeometryStore(s => s.submit),
    hint = useGeometryStore(s => s.hint);
  const pending = session.entries.find(e => e.step === step.id);
  const [answer, setAnswer] = useState(
      initial?.answer ?? pending?.answer ?? '',
    ),
    [evidence, setEvidence] = useState(
      initial?.evidence ?? pending?.evidence ?? '',
    );
  const [feedback, setFeedback] = useState<Evaluation | null>(null);
  const [manual, setManual] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    input.current?.focus();
  }, [manual]);
  function send(event: FormEvent) {
    event.preventDefault();
    const outcome = evaluate(id, session, step, answer, evidence);
    setFeedback(outcome);
    submit(id, answer, evidence);
    onOutcome?.(outcome);
  }
  return (
    <section
      className='tutor-calculation'
      aria-label={`Calcular ${step.label}`}
    >
      <h3>{step.label}</h3>
      <p className='tutor-question'>{step.prompt}</p>
      <div
        className='calculation-mode'
        role='group'
        aria-label='Como fazer a conta'
      >
        <button
          type='button'
          aria-pressed={!manual}
          onClick={() => setManual(false)}
        >
          Passo a passo
        </button>
        <button
          type='button'
          aria-pressed={manual}
          onClick={() => setManual(true)}
        >
          Digitar livremente
        </button>
      </div>
      {!manual ? (
        <GuidedCalculation
          id={id}
          step={step}
          session={session}
          onOutcome={onOutcome}
        />
      ) : (
        <>
          <form onSubmit={send}>
            <label htmlFor='answer'>Seu resultado</label>
            <input
              id='answer'
              ref={input}
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder={step.placeholder}
              maxLength={160}
              required
              autoComplete='off'
              spellCheck={false}
            />
            <label htmlFor='evidence' className='proof-label'>
              A relação que justifica
            </label>
            <textarea
              id='evidence'
              rows={2}
              value={evidence}
              onChange={e => setEvidence(e.target.value)}
              maxLength={500}
              autoComplete='off'
              spellCheck={false}
              aria-describedby='proof-help'
            />
            <p className='input-help' id='proof-help'>
              {proofHelp}
            </p>
            <details className='notation-help'>
              <summary>Como digitar a matemática</summary>
              <p>
                Frações: 1/2. Radicais: sqrt(2). Coordenadas: (x, y); se usar
                vírgula decimal, separe x e y com ponto e vírgula. Retas: forma
                geral, reduzida ou ponto-inclinação. Nas relações, substitua
                “valor” pelo cálculo exato, e separe cada relação com ponto e
                vírgula.
              </p>
            </details>
            <div className='tutor-actions'>
              <Button type='submit'>Verificar passo</Button>
              <Button
                type='button'
                variant='ghost'
                onClick={() => hint(id, step.id)}
              >
                Uma pista
              </Button>
            </div>
          </form>
          {(session.hints[step.id] ?? 0) > 0 ? (
            <div className='hint-box'>
              <span className='eyebrow'>PISTA · DERIVADO</span>
              <p>{step.hints[(session.hints[step.id] ?? 1) - 1]}</p>
            </div>
          ) : null}
          {feedback ? (
            <div
              className={`feedback feedback-${feedback.state}`}
              role='status'
            >
              <strong>
                {feedback.state === 'validado'
                  ? 'Passo validado'
                  : feedback.state === 'calculado'
                    ? 'Resultado correto · justificativa pendente'
                    : feedback.state === 'ambigua'
                      ? 'Vamos esclarecer, sem penalidade'
                      : 'Vamos revisar esta relação'}
              </strong>
              <p>{feedback.message}</p>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
