import { afterEach, expect, it } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
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
  expect(screen.getByLabelText('Seu resultado')).toBeTruthy();
});
