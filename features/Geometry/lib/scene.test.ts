import { expect, it } from 'vitest';
import { frameFor, projectToLine, rightAnglePath } from './scene';
it('uses one scale for both axes so perpendiculars remain perpendicular on screen', () => {
  const f = frameFor([
    { x: 2, y: -1 },
    { x: 0, y: 3 },
    { x: 1, y: 2 },
  ]);
  const a = f.map({ x: 0, y: 0 }),
    x = f.map({ x: 1, y: 0 }),
    y = f.map({ x: 0, y: 1 });
  expect(x.x - a.x).toBeCloseTo(a.y - y.y, 10);
  for (const p of [
    { x: 2, y: -1 },
    { x: 0, y: 3 },
    { x: 1, y: 2 },
  ]) {
    const q = f.map(p);
    expect(q.x).toBeGreaterThan(40);
    expect(q.x).toBeLessThan(680);
    expect(q.y).toBeGreaterThan(40);
    expect(q.y).toBeLessThan(460);
  }
});
it('projects onto the supporting line, including feet outside the finite opposite side', () => {
  const a = { x: 2, y: -1 },
    b = { x: 0, y: 3 },
    c = { x: 1, y: 2 };
  const foot = projectToLine(c, a, b);
  expect(foot.x).toBeCloseTo(0.6);
  expect(foot.y).toBeCloseTo(1.8);
  const footA = projectToLine(a, b, c);
  expect(footA).toEqual({ x: 3, y: 0 });
  expect(
    (a.x - footA.x) * (c.x - b.x) + (a.y - footA.y) * (c.y - b.y),
  ).toBeCloseTo(0);
});
it('builds a legible right-angle square from normalized geometric directions', () => {
  const path = rightAnglePath(
    { x: 100, y: 100 },
    { x: 2, y: 0 },
    { x: 0, y: 5 },
    18,
  );
  expect(path).toBe('M118,100 L118,118 L100,118');
});
