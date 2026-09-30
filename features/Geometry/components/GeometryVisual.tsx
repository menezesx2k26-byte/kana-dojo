'use client';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/shared/ui/components/button';
import { GeometryScene } from './GeometryScene';
import { visibleVisual } from '../lib/visual';
import type { Visual } from '../data/activities';
import { isolatedVisualURL } from '../lib/visualOrigin';

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
      <GeometryScene visual={visible} />
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
