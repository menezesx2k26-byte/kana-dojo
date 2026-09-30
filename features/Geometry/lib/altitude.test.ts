import { expect, it } from 'vitest';
import { activities, catalog } from '../data/activities';
import {
  emptySession,
  submit,
  evaluate,
  completed,
  confirmed,
  rewind,
  validateStoredSession,
} from './tutor';
const id = 'altura-ortocentro';
const start = () => ({
  ...emptySession(),
  tool: activities[id]?.tools[0] ?? '',
  rationale: 'A altura passa pelo vértice e é perpendicular ao lado oposto.',
});
it('adds a separately sourced derived exercise without renumbering the 79 original questions', () => {
  expect(catalog).toHaveLength(79);
  expect(activities[id]?.reference).toMatch(/Derivado/);
  expect(activities[id]?.given).toEqual(['A=(2, −1)', 'B=(0, 3)', 'C=(1, 2)']);
});
it.each(['x-2y+3=0', 'y=x/2+3/2', 'y-2=(1/2)(x-1)', '-2x+4y-6=0'])(
  'validates the first altitude as %s',
  line => {
    const s = submit(id, start(), line, 'hC(C)=0;v_AB.v_hC=0');
    expect(confirmed(s)['altura-c']).toBe(line);
  },
);
it('supports slope evidence and the second altitude through A, including its external foot', () => {
  let s = submit(id, start(), 'y=x/2+3/2', 'hC(C)=0;m_AB*m_hC=-1');
  s = submit(id, s, 'y+1=x-2', 'hA(A)=0;m_BC*m_hA=-1');
  expect(confirmed(s)['altura-a']).toBe('y+1=x-2');
  s = submit(id, s, '(9,6)', 'hC(H)=0;hA(H)=0');
  expect(completed(id, s)).toBe(true);
});
it('keeps a correct altitude with pending proof out of subsequent premises', () => {
  const s = submit(id, start(), 'x-2y+3=0', '');
  expect(s.entries[0].state).toBe('calculado');
  expect(
    evaluate(id, s, activities[id].steps[1], 'x-y-3=0', 'hA(A)=0;v_BC.v_hA=0')
      .state,
  ).toBe('bloqueada');
  expect(
    evaluate(id, s, activities[id].steps[2], '(9,6)', 'hC(H)=0;hA(H)=0').state,
  ).toBe('bloqueada');
});
it('rejects the median and diagnoses perpendicularity rather than asking for a midpoint', () => {
  const s = submit(id, start(), 'x=1', 'hC(C)=0;v_AB.v_hC=0');
  expect(s.entries[0].state).toBe('proposto');
  expect(s.firstDivergence?.message).toMatch(/mediana|ponto médio/);
});
it('preserves the first correct altitude when the second has a wrong intercept and when RESET returns to it', () => {
  let s = submit(id, start(), 'x-2y+3=0', 'hC(C)=0;v_AB.v_hC=0');
  s = submit(id, s, 'y=x', 'hA(A)=0;v_BC.v_hA=0');
  expect(s.firstDivergence?.message).toMatch(/A/);
  expect(confirmed(s)['altura-c']).toBeTruthy();
  s = submit(id, s, '2x-2y=6', 'hA(A)=0;v_BC.v_hA=0');
  s = submit(id, s, '(9,6)', 'hC(H)=0;hA(H)=0');
  const reopened = rewind(id, s, 'altura-a');
  expect(confirmed(reopened)).toEqual({ 'altura-c': 'x-2y+3=0' });
});
it('replays exact math on hydration and refuses a forged premature orthocenter', () => {
  const forged = {
    ...start(),
    entries: [
      {
        step: 'ortocentro',
        answer: '(9,6)',
        evidence: 'hC(H)=0;hA(H)=0',
        state: 'validado',
      },
    ],
  };
  expect(confirmed(validateStoredSession(id, forged))).toEqual({});
});
