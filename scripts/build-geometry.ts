import { writeFileSync, readFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { activityList } from '../features/Geometry/data/activities';
import {
  comparisonVisual,
  type ComparisonMode,
} from '../features/Geometry/lib/comparison';
import {
  geogebraDocument,
  visibleVisual,
} from '../features/Geometry/lib/visual';
import {
  visualOrigin,
  isolatedVisualURL,
} from '../features/Geometry/lib/visualOrigin';
const sourceSha = spawnSync('git', ['rev-parse', 'HEAD'], {
  encoding: 'utf8',
}).stdout.trim();
if (!/^[a-f0-9]{40}$/.test(sourceSha))
  throw new Error('Cannot identify source commit');
const manifest = JSON.stringify({
  app: 'geometria-analitica-dojo',
  repository: 'menezesx2k26-byte/kana-dojo',
  sourceSha,
  visualOrigin,
});
if (!isolatedVisualURL('', 'lista-2-q01:'))
  throw new Error('Invalid isolated visual origin');
const documents: Record<string, string> = {};
for (const activity of activityList) {
  for (let count = 0; count <= activity.steps.length; count++) {
    const stages = activity.steps.slice(0, count).map(s => s.id);
    const verified = Object.fromEntries(stages.map(s => [s, 'validated']));
    documents[`${activity.id}:${stages.sort().join(',')}`] = geogebraDocument(
      visibleVisual(activity.visual, verified),
    );
  }
}
for (const mode of ['median', 'altitude', 'bisector'] as ComparisonMode[]) {
  documents[`comparacao-${mode}:`] = geogebraDocument(comparisonVisual(mode));
}
mkdirSync('geometry/visual-out', { recursive: true });
const map = JSON.stringify(documents).replace(/</g, '\\u003c');
writeFileSync(
  'geometry/visual-out/geogebra.html',
  `<!doctype html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"></head><body><script>const documents=${map};const key=location.hash.slice(1);const markup=documents[key];if(markup){document.open();document.write(markup);document.close();}else{document.body.textContent='Construção indisponível';parent.postMessage({kind:'geometry-ggb',status:'failed'},'*');}</script></body></html>`,
);
copyFileSync('LICENSE.md', 'geometry/public/LICENSE.txt');
copyFileSync('LICENSE.md', 'geometry/visual-out/LICENSE.txt');
copyFileSync('geometry/public/robots.txt', 'geometry/visual-out/robots.txt');
copyFileSync('geometry/visual-headers', 'geometry/visual-out/_headers');
writeFileSync('geometry/visual-out/deployment-info.json', manifest);
const result = spawnSync(
  process.execPath,
  ['node_modules/next/dist/bin/next', 'build', 'geometry', '--webpack'],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: '1',
      NEXT_PUBLIC_GEOMETRY_SOURCE_SHA: sourceSha,
    },
  },
);
if (result.status === 0) {
  writeFileSync('geometry/out/deployment-info.json', manifest);
  writeFileSync(
    'geometry/out/_headers',
    readFileSync('geometry/public/_headers', 'utf8').replaceAll(
      '__VISUAL_ORIGIN__',
      visualOrigin,
    ),
  );
}
process.exit(result.status ?? 1);
