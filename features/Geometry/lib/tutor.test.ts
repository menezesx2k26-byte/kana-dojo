import { describe, it, expect } from 'vitest';
import { activities, catalog, activityList } from '../data/activities';
import {
  emptySession,
  evaluate,
  submit,
  confirmed,
  completed,
  rewind,
  validateStoredSession,
} from './tutor';
const start = () => ({
  ...emptySession(),
  tool: activities['lista-2-q01'].tools[0],
  rationale: 'O ponto médio oferece o segundo ponto da reta.',
});
const id = 'lista-2-q01';
describe('tutor and dependency ledger', () => {
  it('catalogs all stable source IDs and blocks unsupported parabola provenance', () => {
    expect(catalog).toHaveLength(79);
    expect(new Set(catalog.map(q => q.id)).size).toBe(79);
    expect(catalog.filter(q => q.list === 1)).toHaveLength(30);
    expect(catalog.filter(q => q.list === 2)).toHaveLength(49);
    for (const key of ['lista-2-q05', 'lista-2-q49']) {
      expect(catalog.find(q => q.id === key)?.provenance).toBe(
        'Pendente de fonte',
      );
      expect(activities[key]).toBeUndefined();
    }
  });
  it('keeps a correct result with pending evidence outside confirmed premises', () => {
    const s = submit(id, start(), '(-1.5,.5)', '');
    expect(s.entries[0].state).toBe('calculado');
    expect(confirmed(s)).toEqual({});
    expect(
      evaluate(id, s, activities[id].steps[1], '3x+7y+1=0', 's(A)=0;s(M)=0')
        .state,
    ).toBe('bloqueada');
  });
  it('clarifies ambiguity without recording wrong attempts', () => {
    const s = start();
    expect(evaluate(id, s, activities[id].steps[0], '(1,5,2)', '').state).toBe(
      'ambigua',
    );
    expect(submit(id, s, '(1,5,2)', '')).toEqual(s);
  });
  it('accepts equivalent midpoint reasoning and diagnoses one wrong coordinate', () => {
    const s = start();
    expect(
      evaluate(id, s, activities[id].steps[0], '(-3/2,2)', 'M=(B+C)/2').message,
    ).toMatch(/abscissa está correta/);
    expect(submit(id, s, '(-3/2,1/2)', 'M=B+(C-B)/2').entries[0].state).toBe(
      'validado',
    );
  });
  it.each([
    ['-3x-7y-1=0', 's(O)=-1', 's(T)=-1'],
    ['y=-3x/7-1/7', 's(O)=1/7', 's(T)=1/7'],
    ['6x+14y+2=0', 's(O)=2', 's(T)=2'],
  ])('completes Q1 using %s and its own residues', (line, o, t) => {
    let s = submit(id, start(), '(-3/2,1/2)', 'M=(C+B)/2');
    s = submit(id, s, line, 's(M)=0;s(A)=0');
    s = submit(id, s, 'não', o);
    s = submit(id, s, 'não', t);
    expect(completed(id, s)).toBe(true);
  });
  it('preserves earlier work and the first divergence through a correction', () => {
    let s = submit(id, start(), '(-3/2,1/2)', 'M=(B+C)/2');
    s = submit(id, s, '3x+7y-1=0', 's(A)=0;s(M)=0');
    expect(confirmed(s).medio).toBe('(-3/2,1/2)');
    expect(s.firstDivergence?.step).toBe('reta');
    s = submit(id, s, '3x+7y+1=0', 's(A)=0;s(M)=0');
    expect(s.entries[1].state).toBe('corrigido');
    expect(s.firstDivergence?.corrected).toBe(true);
  });
  it('reopening a premise invalidates its descendants', () => {
    let s = submit(id, start(), '(-3/2,1/2)', 'M=(B+C)/2');
    s = submit(id, s, '3x+7y+1=0', 's(A)=0;s(M)=0');
    s = submit(id, s, 'não', 's(O)=1');
    expect(rewind(id, s, 'reta').entries.map(e => e.step)).toEqual(['medio']);
  });
  it('restores a corrected first divergence after revalidating stored mathematics', () => {
    let s = submit(id, start(), '(-3/2,1/2)', 'M=(B+C)/2');
    s = submit(id, s, '3x+7y-1=0', 's(A)=0;s(M)=0');
    s = submit(id, s, '3x+7y+1=0', 's(A)=0;s(M)=0');
    const restored = validateStoredSession(id, JSON.parse(JSON.stringify(s)));
    expect(restored.firstDivergence).toEqual(s.firstDivergence);
    expect(restored.entries[1].state).toBe('corrigido');
  });
  it('records an incorrect justification without losing the correct result', () => {
    const s = submit(id, start(), '(-3/2,1/2)', 'M=B');
    expect(s.entries[0].state).toBe('calculado');
    expect(s.firstDivergence?.step).toBe('medio');
    expect(confirmed(s)).toEqual({});
  });
  it('revalidates persisted data instead of trusting saved statuses', () => {
    const forged = {
      ...start(),
      entries: [
        {
          step: 'medio',
          answer: '(99,99)',
          evidence: 'M=(B+C)/2',
          state: 'validado',
        },
      ],
    };
    expect(confirmed(validateStoredSession(id, forged))).toEqual({});
  });
  it('does not accept true but unrelated mathematical evidence', () => {
    const s = submit(id, start(), '(-3/2,1/2)', 'M=B');
    expect(s.entries[0].state).toBe('calculado');
  });
  it.each([
    ['lista-1-q02', [['5', 'd^2=3^2+(-4)^2']]],
    [
      'lista-1-q07',
      [
        ['(-2,1.5)', 'M=P+(R-P)/2'],
        ['sqrt(221/4)', 'd^2=(-2-3)^2+(1.5+4)^2'],
      ],
    ],
    [
      'lista-2-q04',
      [
        ['y=(x+3)/2', 'r(A)=0;r(B)=0'],
        ['(5,4)', 'r(P)=0;s(P)=0'],
      ],
    ],
    ['lista-2-q15', [['y-2=(-1/2)(x-4)', 'm_r*m_s=-1;s(P)=0']]],
    [
      'lista-2-q16',
      [
        ['(3,1)', 'M=(A+B)/2'],
        ['2x+3y=9', 's(M)=0;n_AB.n_s=0'],
      ],
    ],
    ['lista-2-q30', [['3sqrt(13)/13', '|r(P)|=3;a^2+b^2=13']]],
  ])('has a valid complete path for %s', (key, inputs) => {
    let s = {
      ...emptySession(),
      tool: activities[key].tools[0],
      rationale: 'Escolhi esta relação para chegar ao alvo geométrico.',
    };
    for (const [answer, proof] of inputs) s = submit(key, s, answer, proof);
    expect(completed(key, s)).toBe(true);
    expect(validateStoredSession(key, s).entries).toHaveLength(
      s.entries.length,
    );
  });
  it('has no active exercise without an original source or an explicitly labeled derived reference', () =>
    expect(
      activityList.every(
        a =>
          catalog.some(q => q.id === a.id) ||
          (a.id === 'altura-ortocentro' && a.reference.startsWith('Derivado:')),
      ),
    ).toBe(true));
});
