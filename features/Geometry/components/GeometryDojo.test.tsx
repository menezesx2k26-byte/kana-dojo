import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { GeometryDojo } from './GeometryDojo';
import { useGeometryStore } from '../store/useGeometryStore';
afterEach(cleanup);
it('places the geometric figure before algebra inputs and the secondary ledger in reading order', async () => {
  useGeometryStore.setState({
    hydrated: true,
    selected: 'lista-2-q01',
    sessions: {},
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
