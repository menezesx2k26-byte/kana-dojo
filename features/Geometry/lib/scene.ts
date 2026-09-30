/** Authored drawing geometry, never a mathematical proof or student-answer parser. */
export interface Vec2 {
  x: number;
  y: number;
}
export interface RightAngle {
  at: Vec2;
  along: Vec2;
  toward: Vec2;
  after?: string;
}
export interface Construction {
  from: Vec2;
  to: Vec2;
  kind: 'median' | 'altitude' | 'bisector' | 'projection' | 'target';
  infinite?: boolean;
  label?: string;
  after?: string;
}
export interface EqualMark {
  a: Vec2;
  b: Vec2;
  after?: string;
}
export function frameFor(points: Vec2[], width = 720, height = 480) {
  const xs = points.map(p => p.x),
    ys = points.map(p => p.y);
  const minX = Math.min(...xs, 0),
    maxX = Math.max(...xs, 0),
    minY = Math.min(...ys, 0),
    maxY = Math.max(...ys, 0);
  const cx = (minX + maxX) / 2,
    cy = (minY + maxY) / 2;
  const scale = Math.min(
    (width - 136) / Math.max(4, maxX - minX),
    (height - 136) / Math.max(4, maxY - minY),
  );
  return {
    width,
    height,
    scale,
    minX: cx - width / 2 / scale,
    maxX: cx + width / 2 / scale,
    minY: cy - height / 2 / scale,
    maxY: cy + height / 2 / scale,
    map: (p: Vec2): Vec2 => ({
      x: width / 2 + (p.x - cx) * scale,
      y: height / 2 - (p.y - cy) * scale,
    }),
  };
}
export function projectToLine(p: Vec2, a: Vec2, b: Vec2): Vec2 {
  const dx = b.x - a.x,
    dy = b.y - a.y,
    den = dx * dx + dy * dy;
  if (!den) throw new Error('A supporting line needs distinct points.');
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / den;
  return { x: a.x + t * dx, y: a.y + t * dy };
}
export function rightAnglePath(
  at: Vec2,
  along: Vec2,
  toward: Vec2,
  size = 20,
): string {
  const u = Math.hypot(along.x, along.y),
    v = Math.hypot(toward.x, toward.y);
  if (!u || !v) return '';
  const a = { x: (along.x / u) * size, y: (along.y / u) * size },
    b = { x: (toward.x / v) * size, y: (toward.y / v) * size };
  return `M${at.x + a.x},${at.y + a.y} L${at.x + a.x + b.x},${at.y + a.y + b.y} L${at.x + b.x},${at.y + b.y}`;
}
