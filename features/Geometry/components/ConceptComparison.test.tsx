import { afterEach, expect, it } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { ConceptComparison } from './ConceptComparison';

afterEach(cleanup);

it('opens the selected comparison in an isolated applet and follows construction changes', () => {
  render(<ConceptComparison />);
  expect(document.querySelector('iframe')).toBeNull();
  fireEvent.click(
    screen.getByRole('button', { name: 'Arrastar pontos no GeoGebra' }),
  );
  expect(document.querySelector('iframe')?.src).toBe(
    'http://127.0.0.1:3101/geogebra.html#comparacao-median:',
  );
  fireEvent.click(screen.getByRole('button', { name: /^Altura.*90°/ }));
  expect(document.querySelector('iframe')?.src).toBe(
    'http://127.0.0.1:3101/geogebra.html#comparacao-altitude:',
  );
  expect(screen.getByRole('status').textContent).toContain('Carregando');
  fireEvent.click(screen.getByRole('button', { name: /^Mediatriz/ }));
  expect(document.querySelector('iframe')?.src).toBe(
    'http://127.0.0.1:3101/geogebra.html#comparacao-bisector:',
  );
});

it('restores the matching semantic diagram while switching from a ready comparison', () => {
  render(<ConceptComparison />);
  fireEvent.click(
    screen.getByRole('button', { name: 'Arrastar pontos no GeoGebra' }),
  );
  const frame = document.querySelector('iframe')!;
  act(() =>
    window.dispatchEvent(
      new MessageEvent('message', {
        source: frame.contentWindow,
        origin: 'http://127.0.0.1:3101',
        data: { kind: 'geometry-ggb', status: 'ready' },
      }),
    ),
  );
  expect(screen.queryByRole('img')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /^Altura.*90°/ }));
  expect(screen.getByRole('img', { name: /^Altura: 90°/ })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Usar visual estático' }));
  expect(document.querySelector('iframe')).toBeNull();
  expect(screen.getByRole('img', { name: /^Altura: 90°/ })).toBeTruthy();
});

it('teaches midpoint and perpendicularity with different constructions, without revealing an orthocenter', () => {
  render(<ConceptComparison />);
  expect(document.querySelectorAll('[data-mark=equal]')).toHaveLength(2);
  expect(document.querySelector('[data-mark=right-angle]')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /^Altura/ }));
  expect(document.querySelector('[data-mark=right-angle]')).toBeTruthy();
  expect(document.querySelectorAll('[data-mark=equal]')).toHaveLength(0);
  expect(
    screen.getByText(/Ponto médio não define altura/, { selector: 'p' }),
  ).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /^Mediatriz/ }));
  expect(document.querySelectorAll('[data-mark=equal]')).toHaveLength(2);
  expect(document.querySelector('[data-mark=right-angle]')).toBeTruthy();
  expect(
    screen.getByText(/Não precisa sair de um vértice/, { selector: 'p' }),
  ).toBeTruthy();
  expect(document.querySelector('svg').textContent).not.toContain('H');
});
