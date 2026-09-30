import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { GeometryDojo } from './GeometryDojo';
import { emptySession } from '../lib/tutor';
import { useGeometryStore } from '../store/useGeometryStore';
afterEach(cleanup);
it('places the geometric figure before algebra inputs and the secondary ledger in reading order', async () => {
  useGeometryStore.setState({
    hydrated: true,
    selected: 'lista-2-q01',
    sessions: {
      'lista-2-q01': {
        ...emptySession(),
        tool: 'Ponto médio + determinante',
        rationale: 'O meio de BC determina a reta com A.',
      },
    },
  });
  render(<GeometryDojo />);
  const figure = await screen.findByRole('img', {
    name: /^A relação geométrica/,
  });
  const answer = screen.getByLabelText('Seu resultado');
  const ledger = screen.getByRole('heading', { name: 'LEDGER' });
  expect(
    figure.compareDocumentPosition(answer) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(
    figure.compareDocumentPosition(ledger) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
});
it('constructs the altitude tool from geometry and treats midpoint confusion before any algebra input', async () => {
  localStorage.clear();
  useGeometryStore.setState({
    hydrated: true,
    selected: 'altura-ortocentro',
    sessions: {},
  });
  render(<GeometryDojo />);
  expect(
    await screen.findByRole('heading', { name: 'O encontro das alturas' }),
  ).toBeTruthy();
  expect(screen.queryByLabelText('Seu resultado')).toBeNull();
  const { fireEvent } = await import('@testing-library/react');
  fireEvent.click(screen.getByRole('button', { name: 'Vértice C' }));
  fireEvent.click(screen.getByRole('button', { name: 'Lado AB' }));
  fireEvent.click(
    screen.getByRole('button', { name: 'Passar pelo ponto médio' }),
  );
  expect(
    screen.getByRole('region', {
      name: 'Comparar mediana, altura e mediatriz',
    }),
  ).toBeTruthy();
  expect(screen.queryByLabelText('Seu resultado')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Perpendicular · 90°' }));
  fireEvent.click(screen.getByRole('button', { name: /Inclinações ·/ }));
  fireEvent.change(
    screen.getByLabelText('Por que esta relação encontra a altura?'),
    {
      target: {
        value: 'A perpendicular passa por C e forma ângulo reto com AB.',
      },
    },
  );
  fireEvent.click(screen.getByRole('button', { name: 'Construir a equação' }));
  expect(screen.getByLabelText('Seu resultado')).toBeTruthy();
  expect(
    useGeometryStore.getState().sessions['altura-ortocentro'].firstDivergence
      ?.kind,
  ).toBe('conceitual');
});
it('moves keyboard focus to the next relationship and asks for a fresh explanation for the second height', async () => {
  const { fireEvent, waitFor } = await import('@testing-library/react');
  localStorage.clear();
  useGeometryStore.setState({
    hydrated: true,
    selected: 'altura-ortocentro',
    sessions: {},
  });
  render(<GeometryDojo />);
  fireEvent.click(await screen.findByRole('button', { name: 'Vértice C' }));
  fireEvent.click(screen.getByRole('button', { name: 'Lado AB' }));
  fireEvent.click(screen.getByRole('button', { name: 'Perpendicular · 90°' }));
  fireEvent.click(screen.getByRole('button', { name: /Inclinações ·/ }));
  fireEvent.change(
    screen.getByLabelText('Por que esta relação encontra a altura?'),
    { target: { value: 'A altura sai de C e é perpendicular ao lado AB.' } },
  );
  fireEvent.click(screen.getByRole('button', { name: 'Construir a equação' }));
  fireEvent.change(screen.getByLabelText('Seu resultado'), {
    target: { value: 'x-2y+3=0' },
  });
  fireEvent.change(screen.getByLabelText('A relação que justifica'), {
    target: { value: 'hC(C)=0;v_AB.v_hC=0' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Verificar passo' }));
  await waitFor(() =>
    expect(document.activeElement).toBe(
      screen.getByRole('region', { name: 'Tutor da relação geométrica' }),
    ),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Vértice A' }));
  fireEvent.click(screen.getByRole('button', { name: 'Lado BC' }));
  fireEvent.click(screen.getByRole('button', { name: 'Perpendicular · 90°' }));
  expect(
    (
      screen.getByLabelText(
        'Por que esta relação encontra a altura?',
      ) as HTMLTextAreaElement
    ).value,
  ).toBe('');
  expect(
    (
      screen.getByRole('button', {
        name: 'Construir a equação',
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
});
