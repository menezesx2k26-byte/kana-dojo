import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

it('allows the original dedicated Pages preview origin', async () => {
  vi.stubEnv(
    'NEXT_PUBLIC_GEOMETRY_VISUAL_ORIGIN',
    'https://visual.geometria-analitica-dojo.pages.dev',
  );
  const { isolatedVisualURL } = await import('./visualOrigin');
  expect(
    isolatedVisualURL(
      'https://study.geometria-analitica-dojo.pages.dev',
      'altura-ortocentro:altura-c',
    ),
  ).toBe(
    'https://visual.geometria-analitica-dojo.pages.dev/geogebra.html#altura-ortocentro:altura-c',
  );
});

it('allows the Cloudflare-assigned dedicated preview hostname', async () => {
  vi.stubEnv(
    'NEXT_PUBLIC_GEOMETRY_VISUAL_ORIGIN',
    'https://geometry-visual.geometria-analitica-dojo-cmk.pages.dev',
  );
  const { isolatedVisualURL } = await import('./visualOrigin');
  expect(
    isolatedVisualURL(
      'https://feat-geometria-analitica-doj.geometria-analitica-dojo-cmk.pages.dev',
      'altura-ortocentro:altura-c',
    ),
  ).toBe(
    'https://geometry-visual.geometria-analitica-dojo-cmk.pages.dev/geogebra.html#altura-ortocentro:altura-c',
  );
});

it('still refuses the answer-storage origin on the assigned hostname', async () => {
  const origin =
    'https://geometry-visual.geometria-analitica-dojo-cmk.pages.dev';
  vi.stubEnv('NEXT_PUBLIC_GEOMETRY_VISUAL_ORIGIN', origin);
  const { isolatedVisualURL } = await import('./visualOrigin');
  expect(isolatedVisualURL(origin, 'altura-ortocentro:')).toBeUndefined();
});

it('does not allow an unrelated Pages project', async () => {
  vi.stubEnv(
    'NEXT_PUBLIC_GEOMETRY_VISUAL_ORIGIN',
    'https://visual.another-product.pages.dev',
  );
  const { isolatedVisualURL } = await import('./visualOrigin');
  expect(
    isolatedVisualURL(
      'https://study.geometria-analitica-dojo-cmk.pages.dev',
      'altura-ortocentro:',
    ),
  ).toBeUndefined();
});
