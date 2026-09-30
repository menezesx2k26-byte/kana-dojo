'use client';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/shared/ui/components/button';
import { parseLine, approximate } from '../lib/math';
import { visibleVisual } from '../lib/visual';
import type { Visual } from '../data/activities';
import { isolatedVisualURL } from '../lib/visualOrigin';

export function StaticDiagram({ visual }: { visual: Visual }) {
  const px = (x: number) => 34 + (x + 9) * 15,
    py = (y: number) => 260 - (y + 8) * 12;
  return (
    <svg
      viewBox='0 0 400 310'
      role='img'
      aria-label='Plano cartesiano estático com os dados e construções já validados'
      className='static-diagram'
    >
      <defs>
        <pattern
          id='geometry-grid'
          width='15'
          height='12'
          patternUnits='userSpaceOnUse'
          x='34'
          y='20'
        >
          <path
            d='M15 0H0V12'
            fill='none'
            stroke='currentColor'
            opacity='.10'
            strokeWidth='1'
          />
        </pattern>
        <clipPath id='geometry-clip'>
          <rect x='20' y='15' width='360' height='280' />
        </clipPath>
      </defs>
      <rect x='20' y='15' width='360' height='280' fill='url(#geometry-grid)' />
      <g clipPath='url(#geometry-clip)'>
        <path
          d={`M20 ${py(0)}H380 M${px(0)} 15V295`}
          stroke='currentColor'
          opacity='.4'
        />
        <text x='380' y={py(0) - 7} fontSize='12' fill='currentColor'>
          x
        </text>
        <text x={px(0) + 8} y='25' fontSize='12' fill='currentColor'>
          y
        </text>
        {[-8, -4, 4, 8, 12].map(n => (
          <text
            key={`x${n}`}
            x={px(n)}
            y={py(0) + 16}
            fontSize='10'
            textAnchor='middle'
            fill='currentColor'
            opacity='.65'
          >
            {n}
          </text>
        ))}
        {[-4, 4, 8].map(n => (
          <text
            key={`y${n}`}
            x={px(0) - 12}
            y={py(n) + 4}
            fontSize='10'
            fill='currentColor'
            opacity='.65'
          >
            {n}
          </text>
        ))}
        {visual.lines?.map((l, i) => {
          const a = parseLine(l.equation),
            x = approximate(a.x),
            y = approximate(a.y),
            c = approximate(a.c);
          return Math.abs(y) > 1e-10 ? (
            <line
              key={i}
              x1={px(-12)}
              y1={py((12 * x - c) / y)}
              x2={px(15)}
              y2={py((-15 * x - c) / y)}
              stroke={i ? '#9b643b' : '#438063'}
              strokeWidth='2.5'
            />
          ) : (
            <line
              key={i}
              x1={px(-c / x)}
              y1='15'
              x2={px(-c / x)}
              y2='295'
              stroke='#438063'
              strokeWidth='2.5'
            />
          );
        })}
        {visual.segments?.map(([a, b], i) => {
          const p = visual.points.find(p => p.name === a)!,
            q = visual.points.find(p => p.name === b)!;
          return (
            <line
              key={i}
              x1={px(p.x)}
              y1={py(p.y)}
              x2={px(q.x)}
              y2={py(q.y)}
              stroke='currentColor'
              opacity='.6'
              strokeWidth='1.5'
              strokeDasharray={visual.type === 'distance' ? '4 4' : undefined}
            />
          );
        })}
        {visual.points.map(p => (
          <g key={p.name}>
            <circle cx={px(p.x)} cy={py(p.y)} r='4' fill='#79af8c' />
            <text
              x={px(p.x) + 7}
              y={py(p.y) - 8}
              fontSize='13'
              fontWeight='600'
              fill='currentColor'
            >
              {p.name}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}
export function GeometryVisual({
  id,
  visual,
  validated,
}: {
  id: string;
  visual: Visual;
  validated: Record<string, string>;
}) {
  const [enabled, setEnabled] = useState(false),
    [revision, setRevision] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>(
    'loading',
  );
  const frame = useRef<HTMLIFrameElement>(null);
  const visible = visibleVisual(visual, validated);
  const document = isolatedVisualURL(
    typeof window === 'undefined' ? '' : window.location.origin,
    `${id}:${Object.keys(validated).sort().join(',')}`,
  );
  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(() => setStatus('failed'), 20000);
    function receive(event: MessageEvent) {
      if (
        event.source !== frame.current?.contentWindow ||
        event.data?.kind !== 'geometry-ggb' ||
        event.origin !== new URL(document!).origin
      )
        return;
      if (event.data.status === 'ready' || event.data.status === 'failed') {
        clearTimeout(timer);
        setStatus(event.data.status);
      }
    }
    window.addEventListener('message', receive);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('message', receive);
    };
  }, [enabled, document, revision]);
  return (
    <section className='visual-panel' aria-labelledby='visual-heading'>
      <div className='panel-heading'>
        <div>
          <span className='eyebrow'>ENXERGAR A RELAÇÃO</span>
          <h2 id='visual-heading'>Do símbolo ao plano</h2>
        </div>
        <span className='tiny-badge'>GeoGebra</span>
      </div>
      <StaticDiagram visual={visible} />
      <p className='visual-description'>{visual.description}</p>
      <div className='visual-actions'>
        <Button
          type='button'
          variant='outline'
          onClick={() => {
            setStatus('loading');
            setEnabled(true);
            setRevision(n => n + 1);
          }}
        >
          {enabled ? 'Reiniciar GeoGebra' : 'Explorar no GeoGebra'}
        </Button>
        {enabled && (
          <Button
            type='button'
            variant='ghost'
            onClick={() => setEnabled(false)}
          >
            Usar visual estático
          </Button>
        )}
      </div>
      {enabled && (
        <>
          <p role='status' className='muted'>
            {status === 'loading'
              ? 'Carregando a construção… Você pode continuar a resolução.'
              : status === 'ready'
                ? 'Construção interativa pronta. A figura apoia a conta; a validação segue pelo ledger.'
                : 'GeoGebra indisponível. O diagrama e a resolução continuam funcionando.'}
          </p>
          {document && (
            <iframe
              key={`${document}-${revision}`}
              ref={frame}
              title='Construção GeoGebra isolada'
              sandbox='allow-scripts allow-same-origin'
              referrerPolicy='no-referrer'
              src={document}
              className={
                status === 'failed' ? 'ggb-frame hidden-frame' : 'ggb-frame'
              }
            />
          )}
        </>
      )}
      <p className='privacy-note'>
        O GeoGebra carrega uma construção isolada, sem acesso às suas respostas
        ou ao progresso.
      </p>
    </section>
  );
}
