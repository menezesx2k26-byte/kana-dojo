'use client';
import { useId } from 'react';
import type { Visual } from '../data/activities';
import { approximate, parseLine } from '../lib/math';
import { frameFor, rightAnglePath, type Vec2 } from '../lib/scene';
interface GeometrySceneProps {
  visual: Visual;
  onSelect?: (name: string) => void;
  title?: string;
}
export function GeometryScene({
  visual,
  onSelect,
  title = 'A relação geométrica em construção',
}: GeometrySceneProps) {
  const uid = useId().replace(/:/g, '');
  const framing = [
    ...visual.points,
    ...(visual.constructions ?? []).flatMap(c => [c.from, c.to]),
    ...(visual.rightAngles ?? []).map(m => m.at),
  ];
  const f = frameFor(framing),
    map = f.map;
  const center = visual.points.length
    ? {
        x: visual.points.reduce((v, p) => v + p.x, 0) / visual.points.length,
        y: visual.points.reduce((v, p) => v + p.y, 0) / visual.points.length,
      }
    : { x: 0, y: 0 };
  const vector = (p: Vec2) => ({ x: p.x, y: -p.y });
  const choices = onSelect
    ? [
        ...visual.points.map(p => ({
          name: p.name,
          label: `Vértice ${p.name}`,
        })),
        ...(visual.segments ?? []).map(([a, b]) => ({
          name: a + b,
          label: `Lado ${a}${b}`,
        })),
      ]
    : [];
  const infinite = (a: Vec2, b: Vec2) => {
    const p = map(a),
      q = map(b),
      dx = q.x - p.x,
      dy = q.y - p.y,
      length = Math.hypot(dx, dy) || 1;
    return {
      x1: p.x - (dx / length) * 2000,
      y1: p.y - (dy / length) * 2000,
      x2: p.x + (dx / length) * 2000,
      y2: p.y + (dy / length) * 2000,
    };
  };
  const step = Math.max(1, Math.ceil(42 / f.scale));
  const gridX = Array.from(
    { length: Math.ceil((f.maxX - f.minX) / step) + 1 },
    (_, i) => (Math.ceil(f.minX / step) + i) * step,
  );
  const gridY = Array.from(
    { length: Math.ceil((f.maxY - f.minY) / step) + 1 },
    (_, i) => (Math.ceil(f.minY / step) + i) * step,
  );
  return (
    <figure className='geometry-figure'>
      <svg
        viewBox={`0 0 ${f.width} ${f.height}`}
        role='img'
        aria-labelledby={`${uid}-title ${uid}-description`}
        className='geometry-scene'
      >
        <title id={`${uid}-title`}>{title}</title>
        <desc id={`${uid}-description`}>{visual.description}</desc>
        <defs>
          <clipPath id={`${uid}-clip`}>
            <rect x='12' y='12' width={f.width - 24} height={f.height - 24} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${uid}-clip)`}>
          <g className='scene-grid' aria-hidden='true'>
            {gridX.map(x => (
              <line
                key={`x${x}`}
                x1={map({ x, y: 0 }).x}
                x2={map({ x, y: 0 }).x}
                y1='0'
                y2={f.height}
              />
            ))}
            {gridY.map(y => (
              <line
                key={`y${y}`}
                y1={map({ x: 0, y }).y}
                y2={map({ x: 0, y }).y}
                x1='0'
                x2={f.width}
              />
            ))}
          </g>
          <g className='scene-axes' aria-hidden='true'>
            <line
              x1='0'
              x2={f.width}
              y1={map({ x: 0, y: 0 }).y}
              y2={map({ x: 0, y: 0 }).y}
            />
            <line
              y1='0'
              y2={f.height}
              x1={map({ x: 0, y: 0 }).x}
              x2={map({ x: 0, y: 0 }).x}
            />
          </g>
          {visual.extensions?.map((c, i) => (
            <line
              key={`ext${i}`}
              {...infinite(c.from, c.to)}
              className='scene-extension'
            />
          ))}
          {visual.lines?.map((l, i) => {
            const line = parseLine(l.equation),
              a = approximate(line.x),
              b = approximate(line.y),
              c = approximate(line.c);
            const p =
              Math.abs(b) > 1e-10 ? { x: 0, y: -c / b } : { x: -c / a, y: 0 };
            return (
              <line
                key={`line${i}`}
                {...infinite(p, { x: p.x + b, y: p.y - a })}
                className={`scene-line scene-line-${i % 2}`}
              />
            );
          })}
          {visual.segments?.map(([a, b], i) => {
            const p = visual.points.find(p => p.name === a),
              q = visual.points.find(p => p.name === b);
            if (!p || !q) return null;
            const start = map(p),
              end = map(q),
              active =
                visual.oppositeSide?.includes(a) &&
                visual.oppositeSide.includes(b);
            return (
              <g key={`seg${i}`}>
                {onSelect ? (
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke='transparent'
                    strokeWidth='28'
                    onClick={() => onSelect(a + b)}
                    className='scene-touch'
                  />
                ) : null}
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  className={
                    active ? 'scene-side scene-opposite' : 'scene-side'
                  }
                />
                {active ? (
                  <text
                    x={(start.x + end.x) / 2 - 20}
                    y={(start.y + end.y) / 2 + 30}
                    className='scene-side-label'
                  >
                    lado oposto
                  </text>
                ) : null}
              </g>
            );
          })}
          {visual.constructions?.map((c, i) => {
            const p = map(c.from),
              q = map(c.to);
            return (
              <g key={`construction${i}`}>
                <line
                  {...(c.infinite
                    ? infinite(c.from, c.to)
                    : { x1: p.x, y1: p.y, x2: q.x, y2: q.y })}
                  className={`scene-construction scene-${c.kind}`}
                />
                {c.label ? (
                  <text
                    x={(p.x + q.x) / 2 + 18}
                    y={(p.y + q.y) / 2 - 16}
                    className='scene-construction-label'
                  >
                    {c.label}
                  </text>
                ) : null}
              </g>
            );
          })}
          {visual.equalMarks?.map((m, i) => {
            const p = map(m.a),
              q = map(m.b),
              length = Math.hypot(q.x - p.x, q.y - p.y),
              dx = (-(q.y - p.y) / (length || 1)) * 8,
              dy = ((q.x - p.x) / (length || 1)) * 8;
            return (
              <line
                key={`tick${i}`}
                x1={(p.x + q.x) / 2 - dx}
                y1={(p.y + q.y) / 2 - dy}
                x2={(p.x + q.x) / 2 + dx}
                y2={(p.y + q.y) / 2 + dy}
                className='scene-tick'
              />
            );
          })}
          {visual.rightAngles?.map((m, i) => {
            const p = map(m.at);
            return (
              <g key={`right${i}`} data-mark='right-angle'>
                <path
                  d={rightAnglePath(p, vector(m.along), vector(m.toward), 22)}
                  className='scene-right-angle'
                />
                <text x={p.x + 28} y={p.y + 30} className='scene-angle-label'>
                  90°
                </text>
              </g>
            );
          })}
          {visual.points.map(p => {
            const pos = map(p),
              dx = p.x < center.x ? -30 : 16,
              dy = p.y < center.y ? 28 : -19;
            return (
              <g
                key={p.name}
                className={
                  p.name === visual.activeVertex
                    ? 'scene-point scene-active'
                    : 'scene-point'
                }
              >
                {onSelect ? (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r='24'
                    fill='transparent'
                    onClick={() => onSelect(p.name)}
                    className='scene-touch'
                  />
                ) : null}
                {p.name === visual.activeVertex ? (
                  <circle cx={pos.x} cy={pos.y} r='15' className='scene-halo' />
                ) : null}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={p.name === visual.activeVertex ? 6 : 4.5}
                />
                <text x={pos.x + dx} y={pos.y + dy}>
                  {p.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      {onSelect ? (
        <div
          className='scene-selection'
          aria-label='Selecionar objeto na figura'
        >
          {choices.map(c => (
            <button key={c.name} type='button' onClick={() => onSelect(c.name)}>
              {c.label}
            </button>
          ))}
        </div>
      ) : null}
    </figure>
  );
}
