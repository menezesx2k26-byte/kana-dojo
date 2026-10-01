import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const baseURL = process.env.GEOMETRY_BASE_URL ?? 'http://127.0.0.1:3100';
const evidence = resolve(
  process.env.GEOMETRY_EVIDENCE_DIR ?? 'geometry/browser-evidence',
);
mkdirSync(evidence, { recursive: true });
const proxy = process.env.GEOMETRY_BROWSER_PROXY ?? process.env.HTTPS_PROXY;
const browser = await chromium.launch({
  executablePath:
    process.env.GEOMETRY_CHROMIUM_PATH ??
    (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),
  args: [
    '--no-sandbox',
    ...(proxy
      ? [`--proxy-server=${proxy}`, '--proxy-bypass-list=localhost;127.0.0.1']
      : []),
  ],
});
const report = {
  baseURL,
  viewports: [
    [1440, 1000],
    [390, 844],
  ],
  journeys: [],
  geogebra: [],
  screenshots: [],
  sourceSha: null,
};
async function open(width = 390, height = 844) {
  const page = await browser.newPage({
    viewport: { width, height },
    reducedMotion: 'reduce',
  });
  const audit = { errors: [], consoleErrors: [], failed: [], remote: [] };
  page.on('pageerror', e => audit.errors.push(e.message));
  page.on('console', m => {
    if (m.type() === 'error') audit.consoleErrors.push(m.text());
  });
  page.on('requestfailed', r =>
    audit.failed.push({ url: r.url(), error: r.failure()?.errorText }),
  );
  page.on('request', r => {
    if (!/localhost|127\.0\.0\.1/.test(r.url()))
      audit.remote.push({ url: r.url(), method: r.method() });
  });
  await page.goto(baseURL);
  await page.getByRole('heading', { name: 'O encontro das alturas' }).waitFor();
  return { page, audit };
}
async function capture(page, name, locator) {
  if (locator) await locator.scrollIntoViewIfNeeded();
  const collisions = await page
    .locator('svg.geometry-scene')
    .evaluateAll(svgs =>
      svgs.flatMap(svg => {
        const labels = [...svg.querySelectorAll('text')]
          .map(e => ({ text: e.textContent, box: e.getBoundingClientRect() }))
          .filter(e => e.box.width > 0 && e.box.height > 0);
        return labels.flatMap((a, i) =>
          labels
            .slice(i + 1)
            .filter(
              b =>
                Math.min(a.box.right, b.box.right) >
                  Math.max(a.box.left, b.box.left) + 1 &&
                Math.min(a.box.bottom, b.box.bottom) >
                  Math.max(a.box.top, b.box.top) + 1,
            )
            .map(b => [a.text, b.text]),
        );
      }),
    );
  assert.deepEqual(collisions, [], `label collisions in ${name}`);
  await (locator ?? page).screenshot({
    path: resolve(evidence, `${name}.png`),
  });
  report.screenshots.push(`${name}.png`);
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
    'horizontal overflow',
  );
}
async function clean(audit) {
  assert.deepEqual(audit.errors, [], 'page errors');
  assert.deepEqual(audit.consoleErrors, [], 'console errors');
  assert.deepEqual(audit.failed, [], 'failed requests');
}
async function answer(page, result, proof) {
  await page.getByLabel('Seu resultado').fill(result);
  await page.getByLabel('A relação que justifica', { exact: true }).fill(proof);
  await page
    .getByRole('button', { name: 'Verificar passo', exact: true })
    .click();
}
async function prepare(page, v, side) {
  await page.getByRole('button', { name: `Vértice ${v}`, exact: true }).click();
  await page.getByRole('button', { name: `Lado ${side}`, exact: true }).click();
  await page
    .getByRole('button', { name: 'Perpendicular · 90°', exact: true })
    .click();
  await page.getByRole('button', { name: /Inclinações ·/ }).click();
  await page
    .getByLabel('Por que esta relação encontra a altura?')
    .fill(`A altura passa por ${v} e é perpendicular ao lado ${side}.`);
  await page
    .getByRole('button', { name: 'Construir a equação', exact: true })
    .click();
}
async function noH(page) {
  assert.equal(
    await page
      .locator('.altitude-study>.canvas-column>figure svg text')
      .filter({ hasText: /^H$/ })
      .count(),
    0,
    'premature H',
  );
}
try {
  const manifestPage = await browser.newPage();
  report.sourceSha = (
    await (
      await manifestPage.request.get(`${baseURL}/deployment-info.json`)
    ).json()
  ).sourceSha;
  await manifestPage.close();
  for (const [name, width, height] of [
    ['desktop', 1440, 1000],
    ['mobile', 390, 844],
  ]) {
    const { page: p, audit } = await open(width, height);
    assert.equal(
      await p
        .getByRole('button', { name: 'Usar tema claro', exact: true })
        .count(),
      1,
      'new sessions start in the selected violet/lime dark theme',
    );
    assert.match(
      await p
        .getByRole('button', { name: 'Usar tema claro', exact: true })
        .innerText(),
      /Claro/,
      'visible theme label',
    );
    assert.equal(
      await p
        .locator('.dojo-shell')
        .evaluate(e => getComputedStyle(e).colorScheme),
      'dark',
    );
    const canvas = p.locator('.altitude-study>.canvas-column');
    assert.equal(
      await p
        .locator('button:visible')
        .evaluateAll(buttons =>
          buttons.every(b => b.getBoundingClientRect().height >= 44),
        ),
      true,
      'button target height',
    );
    const stage = async label => {
      await capture(p, `${label}-${name}`, canvas);
      const a = await canvas.boundingBox(),
        b = await p.locator('.reference-column').boundingBox();
      assert(a.y + a.height <= b.y + 1, 'canvas overlaps ledger');
    };
    await capture(p, `initial-dark-${name}`);
    await p
      .getByRole('button', { name: 'Usar tema claro', exact: true })
      .click();
    await p.reload();
    await p.getByRole('heading', { name: 'O encontro das alturas' }).waitFor();
    assert.equal(
      await p
        .locator('.dojo-shell')
        .evaluate(e => getComputedStyle(e).colorScheme),
      'light',
      'light theme survives reload',
    );
    assert.match(
      await p
        .getByRole('button', { name: 'Usar tema escuro', exact: true })
        .innerText(),
      /Escuro/,
    );
    await capture(p, `initial-light-${name}`);
    await p
      .getByRole('button', { name: 'Usar tema escuro', exact: true })
      .click();
    await p.reload();
    await p.getByRole('heading', { name: 'O encontro das alturas' }).waitFor();
    assert.equal(
      await p
        .locator('.dojo-shell')
        .evaluate(e => getComputedStyle(e).colorScheme),
      'dark',
      'dark theme survives reload',
    );
    await p
      .getByRole('button', { name: 'Usar tema claro', exact: true })
      .click();
    await p.keyboard.press('Tab');
    assert(
      await p.evaluate(() => document.activeElement !== document.body),
      'keyboard focus',
    );
    assert.equal(await p.getByLabel('Seu resultado').count(), 0);
    await p
      .getByText('Comparar mediana, altura e mediatriz', { exact: true })
      .click();
    const comparison = p.getByRole('region', {
      name: 'Comparar mediana, altura e mediatriz',
    });
    for (const mode of ['Mediana', 'Altura', 'Mediatriz']) {
      await comparison
        .getByRole('button', { name: new RegExp(`^${mode}`) })
        .click();
      if (mode === 'Mediana')
        assert.equal(await comparison.locator('[data-mark=equal]').count(), 2);
      else
        assert.equal(
          await comparison.locator('[data-mark=right-angle]').count(),
          1,
        );
      await capture(p, `${mode.toLowerCase()}-${name}`, comparison);
    }
    await p
      .getByText('Comparar mediana, altura e mediatriz', { exact: true })
      .click();
    await p.getByRole('button', { name: 'Vértice C', exact: true }).focus();
    await p.keyboard.press('Enter');
    await p.getByRole('button', { name: 'Lado AB', exact: true }).focus();
    await p.keyboard.press('Enter');
    await stage('opposite-side');
    await p
      .getByRole('button', { name: 'Passar pelo ponto médio', exact: true })
      .click();
    await comparison.waitFor();
    assert.equal(await p.getByLabel('Seu resultado').count(), 0);
    await capture(p, `midpoint-confusion-${name}`, comparison);
    await p
      .getByRole('button', { name: 'Perpendicular · 90°', exact: true })
      .click();
    await stage('perpendicular-c');
    await p.getByRole('button', { name: /Inclinações ·/ }).click();
    await p
      .getByLabel('Por que esta relação encontra a altura?')
      .fill('A perpendicular passa por C e forma 90 graus com AB.');
    await p
      .getByRole('button', { name: 'Construir a equação', exact: true })
      .click();
    assert.equal(
      await p
        .getByLabel('Seu resultado')
        .evaluate(e => e === document.activeElement),
      true,
      'focus answer',
    );
    assert.equal(
      await p
        .getByLabel('Seu resultado')
        .evaluate(e => parseFloat(getComputedStyle(e).fontSize) >= 16),
      true,
      'mobile input font',
    );
    await answer(p, 'x=1', 'hC(C)=0;v_AB.v_hC=0');
    await comparison.waitFor();
    await answer(p, 'y-2=(1/2)(x-1)', '');
    await p
      .getByText('Resultado correto · justificativa pendente', { exact: true })
      .waitFor();
    await noH(p);
    await answer(p, 'y-2=(1/2)(x-1)', 'hC(C)=0;m_AB*m_hC=-1');
    await p
      .getByRole('heading', { name: 'Uma altura começa em um vértice.' })
      .waitFor();
    await p.waitForFunction(
      () => document.activeElement?.id === 'concept-tutor',
    );
    await stage('first-height');
    const firstHeight = await p.locator('.ledger-list').innerText();
    await p
      .getByRole('button', { name: 'Usar tema escuro', exact: true })
      .click();
    await p.reload();
    await p.getByRole('heading', { name: 'O encontro das alturas' }).waitFor();
    assert.equal(
      await p.locator('.ledger-list').innerText(),
      firstHeight,
      'theme switch preserves validated ledger',
    );
    await p
      .getByRole('button', { name: 'Usar tema claro', exact: true })
      .click();
    await p.getByRole('button', { name: '↺ RESET', exact: true }).click();
    assert.match(await p.locator('.ledger-list').innerText(), /y-2=/);
    await p
      .getByText('RESET · Voltar à relação relevante', { exact: true })
      .waitFor();
    await prepare(p, 'A', 'BC');
    await stage('perpendicular-a');
    await answer(p, 'y=x-3', 'hA(A)=0;v_BC.v_hA=0');
    await p
      .getByRole('button', { name: 'Preciso das três alturas', exact: true })
      .click();
    await p
      .getByText(
        'Duas alturas distintas já determinam a interseção. A terceira pode servir de verificação posterior.',
        { exact: true },
      )
      .waitFor();
    await noH(p);
    await stage('two-heights');
    await p
      .getByRole('button', { name: 'Duas alturas distintas', exact: true })
      .click();
    await answer(p, '(9;6)', 'hC(H)=0;hA(H)=0');
    await p
      .getByRole('heading', { name: 'Você construiu o ortocentro.' })
      .waitFor();
    await stage('completed-light');
    await capture(
      p,
      `ledger-completed-${name}`,
      p.locator('.reference-column'),
    );
    await p
      .getByRole('button', { name: 'Usar tema escuro', exact: true })
      .click();
    await stage('completed-dark');
    await p.reload();
    await p
      .getByRole('heading', { name: 'Você construiu o ortocentro.' })
      .waitFor();
    await p
      .locator('.ledger-list li')
      .filter({ hasText: 'Altura por A' })
      .getByRole('button', { name: 'Revisar esta etapa' })
      .click();
    await noH(p);
    assert.equal(await p.getByLabel('Seu resultado').inputValue(), 'y=x-3');
    assert.match(await p.locator('.ledger-list').innerText(), /y-2=/);
    await p
      .getByRole('button', { name: 'Limpar meus dados', exact: true })
      .click();
    await p
      .getByRole('button', { name: 'Confirmar limpeza', exact: true })
      .click();
    assert.equal(await p.locator('.ledger-list li').count(), 0);
    await clean(audit);
    report.journeys.push({
      name: `altitude-${name}`,
      complete: true,
      reset: true,
      reload: true,
      reviewInvalidates: true,
      clear: true,
      ...audit,
    });
    await p.close();
  }
  for (const selected of ['__proto__', 'constructor', 'toString']) {
    const { page: p, audit } = await open();
    await p.evaluate(
      id =>
        localStorage.setItem(
          'geometria-dojo-v1',
          JSON.stringify({
            version: 1,
            state: {
              selected: id,
              theme: 'light',
              sessions: { [id]: { entries: [] } },
            },
          }),
        ),
      selected,
    );
    await p.reload();
    await p.getByRole('heading', { name: 'O encontro das alturas' }).waitFor();
    assert.equal(await p.locator('.ledger-list li').count(), 0);
    await noH(p);
    await clean(audit);
    report.journeys.push({
      name: `storage-recovery-${selected}`,
      recovered: true,
      ...audit,
    });
    await p.close();
  }
  const cases = [
    [1, 2, [['5', 'd^2=25']]],
    [
      1,
      7,
      [
        ['(-2,1.5)', 'M=(P+R)/2'],
        ['sqrt(221)/2', 'd^2=221/4'],
      ],
    ],
    [
      2,
      1,
      [
        ['(-3/2,1/2)', 'M=(B+C)/2'],
        ['3x+7y+1=0', 's(A)=0;s(M)=0'],
        ['não', 's(O)=1'],
        ['não', 's(T)=1'],
      ],
    ],
    [
      2,
      4,
      [
        ['y=(x+3)/2', 'r(A)=0;r(B)=0'],
        ['(5,4)', 'r(P)=0;s(P)=0'],
      ],
    ],
    [2, 15, [['y-2=(-1/2)(x-4)', 'm_r*m_s=-1;s(P)=0']]],
    [
      2,
      16,
      [
        ['(3,1)', 'M=(A+B)/2'],
        ['2x+3y=9', 's(M)=0;n_AB.n_s=0'],
      ],
    ],
    [2, 30, [['3sqrt(13)/13', '|r(P)|=3;a^2+b^2=13']]],
  ];
  for (const [list, q, inputs] of cases) {
    const { page: p, audit } = await open();
    await p.getByRole('button', { name: /As duas listas/ }).click();
    await p
      .locator('.question-card')
      .filter({ has: p.getByText(`Lista ${list} · Q${q}`, { exact: true }) })
      .click();
    assert.equal(await p.locator('#tool').count(), 0);
    assert.equal(await p.getByLabel('Seu resultado').count(), 0);
    if (list === 2 && (q === 15 || q === 30)) {
      await p
        .getByRole('button', { name: 'Passar pelo ponto médio', exact: true })
        .click();
      assert.match(
        await p.locator('.relation-tutor .feedback').innerText(),
        /P.*r|r.*P/,
      );
      assert.doesNotMatch(
        await p.locator('.relation-tutor .feedback').innerText(),
        /vértice|lado oposto/,
      );
    }
    if (list === 2 && q === 16) {
      await p
        .getByRole('button', { name: 'Sair de um vértice', exact: true })
        .click();
      assert.match(
        await p.locator('.relation-tutor .feedback').innerText(),
        /meio.*90°/,
      );
    }
    await p.locator('.protocol-panel .relation-choices button').first().click();
    await p.locator('.protocol-panel .relation-choices button').first().click();
    await p
      .getByLabel('Como esta relação aproxima você do alvo?')
      .fill(
        'A relação geométrica determina os objetos e sua tradução algébrica.',
      );
    for (const [result, proof] of inputs) await answer(p, result, proof);
    await p
      .getByRole('heading', { name: 'Você construiu a solução.' })
      .waitFor();
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await clean(audit);
    report.journeys.push({
      name: `lista-${list}-q${q}`,
      complete: true,
      ...audit,
    });
    await p.close();
  }
  for (const blocked of [false, true]) {
    const { page: p, audit } = await open(1440, 1000);
    if (blocked) await p.route('https://www.geogebra.org/**', r => r.abort());
    await prepare(p, 'C', 'AB');
    await answer(p, 'x-2y+3=0', 'hC(C)=0;v_AB.v_hC=0');
    await p
      .getByText('Explorar as construções validadas', { exact: true })
      .click();
    await p
      .getByRole('button', { name: 'Explorar no GeoGebra', exact: true })
      .click();
    const panel = p.locator('.exploration-disclosure .visual-panel');
    await panel
      .getByRole('status')
      .filter({ hasText: blocked ? /indisponível/ : /pronta/ })
      .waitFor({ timeout: 45000 });
    await capture(
      p,
      `geogebra-${blocked ? 'fallback' : 'real'}-desktop`,
      panel,
    );
    if (!blocked) {
      const frame = p.frames().find(f => f.url().includes('geogebra.html'));
      assert(frame);
      const ledger = await p.locator('.ledger-list').innerText();
      const dynamic = await frame.evaluate(() => {
        const a = window.ggbApplet,
          before = a.getXcoord('footC');
        a.setCoords('C', 1.8, 2.8);
        return {
          before,
          after: a.getXcoord('footC'),
          angle: a.getValue('right0'),
          prematureH: a.exists('H'),
        };
      });
      assert.notEqual(dynamic.before, dynamic.after);
      assert(Math.abs(dynamic.angle - Math.PI / 2) < 1e-9);
      assert.equal(dynamic.prematureH, false);
      assert.equal(await p.locator('.ledger-list').innerText(), ledger);
      assert.equal(
        await frame.evaluate(() => {
          try {
            return parent.localStorage.length;
          } catch {
            return 'blocked';
          }
        }),
        'blocked',
      );
      assert.equal(
        await frame.evaluate(() => {
          try {
            return parent.document.title;
          } catch {
            return 'blocked';
          }
        }),
        'blocked',
      );
      assert(audit.remote.every(r => r.method === 'GET'));
      await clean(audit);
      report.geogebra.push({
        real: true,
        dynamic,
        isolation: 'blocked',
        ...audit,
      });
      await p.setViewportSize({ width: 390, height: 844 });
      await frame.waitForFunction(() => innerWidth < 390);
      await capture(p, 'geogebra-real-mobile', panel);
      await p
        .getByRole('button', { name: 'Reiniciar GeoGebra', exact: true })
        .click();
      await panel
        .getByRole('status')
        .filter({ hasText: /pronta/ })
        .waitFor({ timeout: 45000 });
      const resetFrame = p
        .frames()
        .find(f => f.url().includes('geogebra.html'));
      assert.equal(
        await resetFrame.evaluate(() => window.ggbApplet.getXcoord('C')),
        1,
      );
      await p
        .getByRole('button', { name: 'Usar visual estático', exact: true })
        .click();
      assert.equal(await panel.locator('svg.geometry-scene').isVisible(), true);
      await clean(audit);
      assert(audit.remote.every(r => r.method === 'GET'));
    } else {
      assert.equal(await panel.locator('svg.geometry-scene').isVisible(), true);
      await p.setViewportSize({ width: 390, height: 844 });
      await capture(p, 'geogebra-fallback-mobile', panel);
      await prepare(p, 'A', 'BC');
      assert.equal(await p.getByLabel('Seu resultado').isVisible(), true);
      assert.deepEqual(audit.errors, []);
      assert(
        audit.failed.length > 0 &&
          audit.failed.every(r =>
            r.url.startsWith('https://www.geogebra.org/'),
          ),
      );
      assert(
        audit.consoleErrors.every(m => m.includes('ERR_FAILED')),
        'only deliberately blocked network errors',
      );
      report.geogebra.push({
        blocked: true,
        fallback: true,
        nextCalculation: true,
        ...audit,
      });
    }
    await p.close();
  }
  writeFileSync(
    resolve(evidence, 'report.json'),
    JSON.stringify(report, null, 2),
  );
  process.stdout.write(
    JSON.stringify({
      passed: true,
      sourceSha: report.sourceSha,
      journeys: report.journeys.length,
      geogebra: report.geogebra.map(g => ({
        real: g.real,
        blocked: g.blocked,
      })),
      screenshots: report.screenshots.length,
      evidence,
    }) + '\n',
  );
} finally {
  await browser.close();
}
