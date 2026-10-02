import { afterEach, expect, it } from 'vitest';
import {
  render,
  screen,
  cleanup,
  fireEvent,
  within,
} from '@testing-library/react';
import { GeometryDojo } from './GeometryDojo';
import { useGeometryStore } from '../store/useGeometryStore';
afterEach(cleanup);
it('teaches the midpoint relationship before tool selection in an existing source exercise', async () => {
  localStorage.clear();
  useGeometryStore.setState({
    selected: 'lista-2-q01',
    sessions: {},
    hydrated: true,
  });
  render(<GeometryDojo />);
  await screen.findByRole('button', { name: 'O meio de BC' });
  expect(
    screen.queryByRole('combobox', { name: 'Ferramenta escolhida' }),
  ).toBeNull();
  expect(screen.queryByLabelText('Seu resultado')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'O meio de BC' }));
  fireEvent.click(
    screen.getByRole('button', {
      name: 'Ponto médio + determinante',
      exact: true,
    }),
  );
  fireEvent.change(
    screen.getByLabelText('Como esta relação aproxima você do alvo?'),
    {
      target: {
        value:
          'O ponto médio de BC é o segundo ponto que determina a reta com A.',
      },
    },
  );
  expect(
    screen.getByRole('region', { name: 'Conta guiada: Ponto médio' }),
  ).toBeTruthy();
  expect(screen.queryByLabelText('Seu resultado')).toBeNull();
});
it.each(['lista-2-q15', 'lista-2-q30'])(
  'grounds perpendicularity feedback in the given point and line for %s',
  async selected => {
    localStorage.clear();
    useGeometryStore.setState({ selected, sessions: {}, hydrated: true });
    render(<GeometryDojo />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Passar pelo ponto médio' }),
    );
    const message = screen.getByRole('status').textContent;
    expect(message).toMatch(/P.*r|r.*P/);
    expect(message).toMatch(/perpendicular/);
    expect(message).not.toMatch(/vértice|lado oposto/);
    expect(
      within(
        screen.getByRole('status').closest('.relation-tutor') as HTMLElement,
      ).queryByRole('region', {
        name: 'Comparar mediana, altura e mediatriz',
      }),
    ).toBeNull();
    expect(screen.queryByLabelText('Seu resultado')).toBeNull();
  },
);
