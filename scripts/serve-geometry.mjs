import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
const port = Number(process.env.GEOMETRY_PORT ?? 3100);
const root = resolve(port === 3101 ? 'geometry/visual-out' : 'geometry/out');
const rules = [];
let rule;
for (const line of readFileSync(resolve(root, '_headers'), 'utf8').split(
  '\n',
)) {
  if (line.startsWith('/')) {
    rule = { path: line.trim(), headers: {} };
    rules.push(rule);
  } else if (rule && line.includes(':')) {
    const colon = line.indexOf(':');
    rule.headers[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
  }
}
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};
createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(
      new URL(req.url, 'http://localhost').pathname,
    );
  } catch {
    res.writeHead(400).end();
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405).end();
    return;
  }
  let file = resolve(root, '.' + pathname);
  if (file !== root && !file.startsWith(root + sep)) {
    res.writeHead(403).end();
    return;
  }
  if (existsSync(file) && statSync(file).isDirectory())
    file = resolve(file, 'index.html');
  for (const r of rules)
    if (
      r.path === pathname ||
      (r.path.endsWith('*') && pathname.startsWith(r.path.slice(0, -1)))
    )
      for (const [key, value] of Object.entries(r.headers))
        res.setHeader(key, value);
  if (!existsSync(file) || statSync(file).isDirectory()) {
    res.writeHead(404).end('Not found');
    return;
  }
  res.setHeader(
    'Content-Type',
    mime[extname(file)] ?? 'application/octet-stream',
  );
  res.end(req.method === 'HEAD' ? undefined : readFileSync(file));
}).listen(port, '127.0.0.1', () =>
  console.log(`Geometry preview: http://127.0.0.1:${port}`),
);
