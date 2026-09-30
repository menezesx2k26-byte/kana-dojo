import { afterEach, expect, it, vi } from 'vitest';
import {
  hydrateGeometry,
  STORAGE_KEY,
  useGeometryStore,
} from './useGeometryStore';
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});
it('clears only this app storage and leaves other products untouched', async () => {
  localStorage.setItem('another-product', 'keep');
  await hydrateGeometry();
  useGeometryStore.getState().clear();
  expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  expect(localStorage.getItem('another-product')).toBe('keep');
  expect(useGeometryStore.getState().sessions).toEqual({});
});
it('continues in memory and informs the UI when browser persistence fails', async () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('quota', 'QuotaExceededError');
  });
  useGeometryStore.getState().select('lista-2-q04');
  await Promise.resolve();
  expect(useGeometryStore.getState().selected).toBe('lista-2-q04');
  expect(useGeometryStore.getState().durable).toBe(false);
});
it.each(['__proto__', 'constructor', 'toString'])(
  'rejects inherited activity ID %s on hydration while retaining valid sessions',
  async selected => {
    useGeometryStore.setState({ selected: 'lista-2-q04', sessions: {} });
    const valid = {
      tool: 'Perpendicularidade + inclinações',
      rationale: 'A altura passa pelo vértice e forma ângulo reto.',
      entries: [],
      hints: {},
    };
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        state: {
          selected,
          theme: 'light',
          sessions: Object.fromEntries([
            ['altura-ortocentro', valid],
            ['__proto__', valid],
            ['constructor', valid],
            ['toString', valid],
          ]),
        },
      }),
    );
    await hydrateGeometry();
    expect(useGeometryStore.getState().selected).toBe('altura-ortocentro');
    expect(Object.keys(useGeometryStore.getState().sessions)).toEqual([
      'altura-ortocentro',
    ]);
    expect(useGeometryStore.getState().sessions['altura-ortocentro'].tool).toBe(
      valid.tool,
    );
  },
);
