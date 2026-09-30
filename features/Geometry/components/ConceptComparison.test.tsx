import { afterEach, expect, it } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ConceptComparison } from './ConceptComparison';
afterEach(cleanup);
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
