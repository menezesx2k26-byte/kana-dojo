import { chromium, type Page } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { activityList } from '../features/Geometry/data/activities';
import { guidedPlan, type GuidedPlan } from '../features/Geometry/lib/guided';
import { emptySession, submit } from '../features/Geometry/lib/tutor';

const base = process.env.GEOMETRY_BASE_URL ?? 'http://127.0.0.1:3100';
const evidence = resolve(
  process.env.GEOMETRY_EVIDENCE_DIR ?? 'geometry/guided-browser-evidence',
);
mkdirSync(evidence, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.GEOMETRY_CHROMIUM_PATH,
});
const report: { journeys: unknown[]; screenshots: string[] } = {
  journeys: [],
  screenshots: [],
};
async function capture(page: Page, name: string) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
    `overflow: ${name}`,
  );
  await page.screenshot({
    path: resolve(evidence, `${name}.png`),
    fullPage: true,
  });
  report.screenshots.push(`${name}.png`);
}
async function solve(page: Page, plan: GuidedPlan, first: boolean) {
  const panel = page.locator('.guided-calculation');
  assert.equal(
    await page.locator('input:visible, textarea:visible').count(),
    0,
    'typing is optional',
  );
  for (const [index, question] of plan.challenges.entries()) {
    await panel
      .getByRole('heading', { name: question.title, exact: true })
      .waitFor();
    const next = panel.getByRole('button', { name: 'Continuar', exact: true });
    assert.equal(
      await next.isEnabled(),
      false,
      'cannot skip unanswered calculation',
    );
    if (first && index === 0) {
      const wrong = question.choices.find(c => c.value !== question.correct)!;
      await panel
        .getByRole('button', { name: wrong.label, exact: true })
        .click();
      assert.equal(
        await next.isEnabled(),
        false,
        'wrong answer does not advance',
      );
      assert.equal(await panel.getByRole('status').innerText(), question.retry);
      await capture(page, 'guided-retry');
    }
    const right = panel.getByRole('button', {
      name: question.choices.find(c => c.value === question.correct)!.label,
      exact: true,
    });
    await right.focus();
    await page.keyboard.press('Enter');
    assert.equal(await right.getAttribute('aria-pressed'), 'true');
    await next.click();
    assert.equal(
      await panel
        .getByRole('heading')
        .evaluate(h => h === document.activeElement),
      true,
      'focus follows the next calculation',
    );
    if (first && index === 0) await capture(page, 'guided-selected-next');
  }
  await panel
    .getByRole('button', { name: 'Validar e continuar', exact: true })
    .click();
}
try {
  for (const width of [1440, 390]) {
    for (const activity of activityList) {
      const page = await browser.newPage({
        viewport: { width, height: width === 390 ? 844 : 1000 },
      });
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base);
      await page
        .getByRole('heading', { name: 'O encontro das alturas', exact: true })
        .waitFor();
      const altitude = activity.id === 'altura-ortocentro';
      if (!altitude) {
        const [list, question] = activity.id
          .match(/lista-(\d)-q0?(\d+)/)!
          .slice(1);
        await page.getByRole('button', { name: /As duas listas/ }).click();
        await page
          .locator('.question-card')
          .filter({
            has: page.getByText(`Lista ${list} · Q${Number(question)}`, {
              exact: true,
            }),
          })
          .click();
        await page
          .locator('.protocol-panel .relation-choices button')
          .first()
          .click();
        await page
          .getByRole('button', { name: activity.tools[0], exact: true })
          .click();
      }
      let session = {
        ...emptySession(),
        tool: activity.tools[0],
        rationale:
          'A relação geométrica determina a construção e as condições verificadas.',
      };
      for (const [index, step] of activity.steps.entries()) {
        if (altitude) {
          if (step.id === 'ortocentro')
            await page
              .getByRole('button', {
                name: 'Duas alturas distintas',
                exact: true,
              })
              .click();
          else {
            const vertex = step.id === 'altura-c' ? 'C' : 'A',
              side = vertex === 'C' ? 'AB' : 'BC';
            await page
              .getByRole('button', { name: `Vértice ${vertex}`, exact: true })
              .click();
            await page
              .getByRole('button', { name: `Lado ${side}`, exact: true })
              .click();
            await page
              .getByRole('button', { name: 'Perpendicular · 90°', exact: true })
              .click();
            await page.getByRole('button', { name: /Inclinações ·/ }).click();
            await page
              .getByRole('button', { name: 'Construir a equação', exact: true })
              .click();
          }
        }
        const plan = guidedPlan(activity.id, step, session)!;
        if (altitude && index < 3)
          assert.equal(
            await page
              .locator('.altitude-study > .canvas-column > figure svg text')
              .filter({ hasText: /^H$/ })
              .count(),
            0,
          );
        if (altitude && index === 0)
          await capture(page, `guided-start-${width}`);
        await solve(page, plan, altitude && index === 0 && width === 1440);
        const result = plan.finish(
          Object.fromEntries(plan.challenges.map(q => [q.id, q.correct])),
        );
        session = submit(activity.id, session, result.answer, result.evidence);
      }
      await page
        .getByRole('heading', {
          name: altitude
            ? 'Você construiu o ortocentro.'
            : 'Você construiu a solução.',
          exact: true,
        })
        .waitFor();
      assert.equal(
        await page.locator('.ledger-list li').count(),
        activity.steps.length,
      );
      await page.reload();
      await page
        .getByRole('heading', {
          name: altitude
            ? 'Você construiu o ortocentro.'
            : 'Você construiu a solução.',
          exact: true,
        })
        .waitFor();
      if (altitude) {
        await capture(page, `guided-complete-dark-${width}`);
        await page
          .getByRole('button', { name: 'Usar tema claro', exact: true })
          .click();
        await capture(page, `guided-complete-light-${width}`);
        await page
          .locator('.ledger-list li')
          .filter({ hasText: 'Altura por A' })
          .getByRole('button', { name: 'Revisar esta etapa', exact: true })
          .click();
        assert.equal(
          await page
            .locator('.altitude-study > .canvas-column > figure svg text')
            .filter({ hasText: /^H$/ })
            .count(),
          0,
        );
        await page
          .getByRole('region', {
            name: 'Conta guiada: Altura por A',
            exact: true,
          })
          .waitFor();
        await capture(page, `guided-review-${width}`);
      }
      assert.deepEqual(errors, []);
      report.journeys.push({
        activity: activity.id,
        width,
        complete: true,
        noTyping: true,
        restored: true,
        errors,
      });
      await page.close();
    }
  }
  writeFileSync(
    resolve(evidence, 'report.json'),
    JSON.stringify(report, null, 2),
  );
  process.stdout.write(
    JSON.stringify({
      journeys: report.journeys.length,
      screenshots: report.screenshots.length,
      evidence,
    }) + '\n',
  );
} finally {
  await browser.close();
}
