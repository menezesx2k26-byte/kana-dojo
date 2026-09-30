import { afterEach, describe, it, expect, vi } from 'vitest';
import {
  cleanup,
  render,
  screen,
  fireEvent,
  act,
} from '@testing-library/react';
import { GeometryVisual } from './GeometryVisual';
import { activities } from '../data/activities';
import { visibleVisual, geogebraDocument } from '../lib/visual';
import { isolatedVisualURL } from '../lib/visualOrigin';
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
describe('visual fallback, gating and isolation', () => {
  it('hides midpoint, result line and numeric answers until validated', () => {
    const v = activities['lista-2-q01'].visual;
    const initial = visibleVisual(v, {});
    expect(initial.points.map(p => p.name)).toEqual(['A', 'B', 'C']);
    expect(initial.lines).toEqual([]);
    expect(
      visibleVisual(v, { medio: '-1.5,.5' }).points.map(p => p.name),
    ).toContain('M');
    expect(visibleVisual(v, { medio: '-1.5,.5' }).lines).toEqual([]);
  });
  it('renders an accessible static alternative before loading any external app', () => {
    render(
      <GeometryVisual
        id='lista-2-q01'
        visual={activities['lista-2-q01'].visual}
        validated={{}}
      />,
    );
    expect(screen.getByRole('img')).toBeTruthy();
    expect(document.querySelector('iframe')).toBeNull();
  });
  it('keeps the fallback when the applet times out and isolates it from origin/storage', () => {
    vi.useFakeTimers();
    render(
      <GeometryVisual
        id='lista-2-q01'
        visual={activities['lista-2-q01'].visual}
        validated={{}}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Explorar no GeoGebra' }),
    );
    const frame = document.querySelector('iframe')!;
    expect(frame.getAttribute('sandbox')).toBe(
      'allow-scripts allow-same-origin',
    );
    expect(frame.getAttribute('src')).toBe(
      'http://127.0.0.1:3101/geogebra.html#lista-2-q01:',
    );
    expect(frame.getAttribute('referrerpolicy')).toBe('no-referrer');
    act(() => vi.advanceTimersByTime(20001));
    expect(screen.getByRole('status').textContent).toMatch(/indisponível/);
    expect(screen.getByRole('img')).toBeTruthy();
  });
  it('does not accept forged applet success messages', () => {
    render(
      <GeometryVisual
        id='lista-2-q01'
        visual={activities['lista-2-q01'].visual}
        validated={{}}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Explorar no GeoGebra' }),
    );
    act(() =>
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { kind: 'geometry-ggb', status: 'ready' },
          source: window,
        }),
      ),
    );
    expect(screen.getByRole('status').textContent).toMatch(/Carregando/);
  });
  it('builds applets only from authored data, without storage, forms or response access', () => {
    const doc = geogebraDocument(
      visibleVisual(activities['lista-2-q01'].visual, {}),
    );
    expect(doc).toContain('new GGBApplet');
    expect(doc).not.toContain('localStorage');
    expect(doc).not.toContain('parent.document');
    expect(doc).not.toContain('3x+7y+1=0');
  });
  it('refuses an applet on the answer-storage origin', () => {
    expect(
      isolatedVisualURL('http://127.0.0.1:3101', 'lista-2-q01:'),
    ).toBeUndefined();
  });
  it('sends only stage identifiers, never validated answers, to the isolated frame', () => {
    render(
      <GeometryVisual
        id='lista-2-q01'
        visual={activities['lista-2-q01'].visual}
        validated={{ medio: 'PRIVATE-STUDENT-ANSWER' }}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Explorar no GeoGebra' }),
    );
    expect(document.querySelector('iframe')?.src).toBe(
      'http://127.0.0.1:3101/geogebra.html#lista-2-q01:medio',
    );
    expect(document.querySelector('iframe')?.src).not.toContain('PRIVATE');
  });
});
