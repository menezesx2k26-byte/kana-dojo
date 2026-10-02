import { expect, it } from 'vitest';
import { activityList, activities } from '../data/activities';
import { guidedPlan } from './guided';
import {
  emptySession,
  evaluate,
  submit,
  completed,
  validateStoredSession,
  confirmed,
  rewind,
} from './tutor';
import { samePoint, parsePoint } from './math';

it.each(activityList.map(a => [a.id]))(
  'completes and restores every step of %s using selected calculations and the exact verifier',
  id => {
    const activity = activities[id];
    let session = {
      ...emptySession(),
      tool: activity.tools[0],
      rationale:
        'A relação escolhida determina a construção e sua verificação.',
    };
    for (const step of activity.steps) {
      const plan = guidedPlan(id, step, session)!;
      expect(plan.challenges.length).toBeGreaterThan(1);
      const choices = Object.fromEntries(
        plan.challenges.map(q => [q.id, q.correct]),
      );
      for (const q of plan.challenges) {
        expect(q.choices.length).toBeGreaterThan(1);
        expect(q.calculation).not.toContain('undefined');
        expect(q.choices.filter(c => c.value === q.correct)).toHaveLength(1);
      }
      const result = plan.finish(choices);
      expect(
        evaluate(id, session, step, result.answer, result.evidence).state,
      ).toBe('validado');
      // A wrong verification must never turn a right result into a confirmed premise.
      const proofQuestion = plan.challenges.find(q =>
        q.id.startsWith('proof-'),
      );
      if (proofQuestion) {
        const bad = plan.finish({
          ...choices,
          [proofQuestion.id]: proofQuestion.choices.find(
            c => c.value !== proofQuestion.correct,
          )!.value,
        });
        expect(
          evaluate(id, session, step, bad.answer, bad.evidence).state,
        ).not.toBe('validado');
      }
      session = submit(id, session, result.answer, result.evidence);
    }
    expect(completed(id, session)).toBe(true);
    expect(completed(id, validateStoredSession(id, session))).toBe(true);
  },
);

it('uses the vector route and prevents unvalidated midpoint and height dependencies', () => {
  const activity = activities['altura-ortocentro'];
  let session = {
    ...emptySession(),
    tool: activity.tools[1],
    rationale: 'O produto escalar zero verifica a perpendicularidade.',
  };
  expect(guidedPlan(activity.id, activity.steps[1], session)).toBeUndefined();
  const plan = guidedPlan(activity.id, activity.steps[0], session)!;
  expect(plan.challenges[0].id).toBe('direction');
  const result = plan.finish(
    Object.fromEntries(plan.challenges.map(q => [q.id, q.correct])),
  );
  session = submit(activity.id, session, result.answer, result.evidence);
  expect(confirmed(session)['altura-c']).toBeTruthy();
  expect(
    guidedPlan(
      'lista-2-q16',
      activities['lista-2-q16'].steps[1],
      emptySession(),
    ),
  ).toBeUndefined();
});

it('builds the orthocenter calculation from equivalent persisted heights and invalidates the conclusion on review', () => {
  const id = 'altura-ortocentro',
    activity = activities[id];
  let session = {
    ...emptySession(),
    tool: activity.tools[0],
    rationale: 'As alturas passam pelo vértice e fazem noventa graus.',
  };
  session = submit(id, session, '2x-4y+6=0', 'hC(C)=0;v_AB.v_hC=0');
  session = submit(id, session, '3y-3x+9=0', 'hA(A)=0;v_BC.v_hA=0');
  const plan = guidedPlan(id, activity.steps[2], session)!;
  const result = plan.finish(
    Object.fromEntries(plan.challenges.map(q => [q.id, q.correct])),
  );
  expect(samePoint(parsePoint(result.answer), parsePoint('(9,6)'))).toBe(true);
  session = submit(id, session, result.answer, result.evidence);
  expect(completed(id, session)).toBe(true);
  const reviewed = rewind(id, session, 'altura-c');
  expect(completed(id, reviewed)).toBe(false);
  expect(guidedPlan(id, activity.steps[2], reviewed)).toBeUndefined();
});
