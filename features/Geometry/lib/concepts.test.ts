import { expect, it } from 'vitest';
import { altitudeVisual, conceptFeedback } from './concepts';
it('targets the actual midpoint/altitude confusion with a visual comparison', () => {
  const error = conceptFeedback('altitude', 'midpoint');
  expect(error.kind).toBe('conceitual');
  expect(error.compare).toBe(true);
  expect(error.message).toMatch(/mediana/);
  expect(conceptFeedback('bisector', 'vertex').message).toMatch(/meio.*90°/);
  expect(conceptFeedback('orthocenter', 'three').message).toMatch(/duas|Duas/);
});
it('reveals vertex, opposite side and 90° successively, and never an early intersection', () => {
  expect(altitudeVisual({}, 0, 'C').activeVertex).toBeUndefined();
  expect(altitudeVisual({}, 1, 'C').activeVertex).toBe('C');
  expect(altitudeVisual({}, 1, 'C').oppositeSide).toBeUndefined();
  expect(altitudeVisual({}, 2, 'C').oppositeSide).toEqual(['A', 'B']);
  expect(altitudeVisual({}, 2, 'C').rightAngles).toHaveLength(0);
  expect(altitudeVisual({}, 3, 'C').rightAngles).toHaveLength(1);
  const both = altitudeVisual(
    { 'altura-c': 'valid', 'altura-a': 'valid' },
    4,
    'A',
  );
  expect(both.lines).toHaveLength(0);
  expect(both.points.map(p => p.name)).not.toContain('H');
  expect(both.constructions.every(c => !c.infinite)).toBe(true);
  const done = altitudeVisual(
    { 'altura-c': 'valid', 'altura-a': 'valid', ortocentro: 'valid' },
    4,
    'A',
  );
  expect(done.points.map(p => p.name)).toContain('H');
  expect(done.lines).toHaveLength(2);
});
