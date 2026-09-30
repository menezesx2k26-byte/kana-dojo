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
