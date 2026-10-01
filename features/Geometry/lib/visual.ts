import { frameFor } from './scene';
import type { Visual } from '../data/activities';
export function visibleVisual(
  visual: Visual,
  validated: Record<string, string>,
): Visual {
  const points = visual.points.filter(
    p => !p.revealAfter || !!validated[p.revealAfter],
  );
  const names = new Set(points.map(p => p.name));
  return {
    ...visual,
    points,
    lines: visual.lines?.filter(l => !l.after || !!validated[l.after]),
    segments: visual.segments?.filter(([a, b]) => names.has(a) && names.has(b)),
    constructions: visual.constructions?.filter(
      c => !c.after || !!validated[c.after],
    ),
    rightAngles: visual.rightAngles?.filter(
      c => !c.after || !!validated[c.after],
    ),
    equalMarks: visual.equalMarks?.filter(
      c => !c.after || !!validated[c.after],
    ),
    extensions: visual.extensions?.filter(
      c => !c.after || !!validated[c.after],
    ),
  };
}
/** Only authored construction data enters this document, never user input or storage. */
export function geogebraDocument(visual: Visual): string {
  const points = [
    ...visual.points,
    ...(visual.constructions ?? []).flatMap(c =>
      c.infinite ? [c.from] : [c.from, c.to],
    ),
  ];
  const frame = frameFor(points);
  const coord = (p: { x: number; y: number }) => `(${p.x},${p.y})`;
  const commands = [
    ...visual.points.map(p => `${p.name}=${coord(p)}`),
    ...(visual.segments ?? []).map(([a, b], i) => `seg${i}=Segment(${a},${b})`),
    ...(visual.lines ?? []).map((l, i) => `line${i}:${l.equation}`),
    ...(visual.constructions ?? []).map(
      (c, i) =>
        `construction${i}=${c.infinite ? 'Line' : 'Segment'}(${coord(c.from)},${coord(c.to)})`,
    ),
    ...(visual.extensions ?? []).map(
      (c, i) => `extension${i}=Line(${coord(c.from)},${coord(c.to)})`,
    ),
  ];
  for (const [i, m] of (visual.rightAngles ?? []).entries()) {
    const unit = 22 / frame.scale;
    const a = Math.hypot(m.along.x, m.along.y),
      b = Math.hypot(m.toward.x, m.toward.y);
    const u = { x: (m.along.x / a) * unit, y: (m.along.y / a) * unit },
      v = { x: (m.toward.x / b) * unit, y: (m.toward.y / b) * unit };
    const p = { x: m.at.x + u.x, y: m.at.y + u.y },
      q = { x: p.x + v.x, y: p.y + v.y },
      r = { x: m.at.x + v.x, y: m.at.y + v.y };
    commands.push(
      `right${i}a=Segment(${coord(p)},${coord(q)})`,
      `right${i}b=Segment(${coord(q)},${coord(r)})`,
      `right${i}label=Text("90°",${coord({ x: m.at.x + 28 / frame.scale, y: m.at.y - 30 / frame.scale })})`,
    );
  }
  for (const [i, m] of (visual.equalMarks ?? []).entries()) {
    const dx = m.b.x - m.a.x,
      dy = m.b.y - m.a.y,
      len = Math.hypot(dx, dy),
      size = 8 / frame.scale;
    const mid = { x: (m.a.x + m.b.x) / 2, y: (m.a.y + m.b.y) / 2 };
    commands.push(
      `tick${i}=Segment(${coord({ x: mid.x - (dy / len) * size, y: mid.y + (dx / len) * size })},${coord({ x: mid.x + (dy / len) * size, y: mid.y - (dx / len) * size })})`,
    );
  }
  const names = visual.points.map(p => p.name);
  const dynamic = visual.exploration === 'triangle-altitudes';
  const comparison = visual.exploration?.startsWith('comparison-') ?? false;
  const hidden: string[] = [];
  if (comparison) {
    commands.splice(
      0,
      commands.length,
      ...visual.points
        .filter(p => ['A', 'B', 'C'].includes(p.name))
        .map(p => `${p.name}=${coord(p)}`),
      'seg0=Segment(A,B)',
      'seg1=Segment(B,C)',
      'seg2=Segment(C,A)',
      'baseAB=Line(A,B)',
    );
    hidden.push('baseAB');
    if (visual.exploration === 'comparison-altitude') {
      commands.push(
        'altC=PerpendicularLine(C,baseAB)',
        'F=Intersect(altC,baseAB)',
        'construction0=Segment(C,F)',
        'right0=Angle(baseAB,altC)',
        'extension0=Line(A,B)',
      );
      hidden.push('altC');
      names.push('F');
    } else {
      commands.push(
        'M=Midpoint(A,B)',
        'partAM=Segment(A,M)',
        'partMB=Segment(M,B)',
      );
      if (visual.exploration === 'comparison-median')
        commands.push('construction0=Segment(C,M)');
      else
        commands.push(
          'construction0=PerpendicularLine(M,baseAB)',
          'right0=Angle(baseAB,construction0)',
        );
    }
  }
  if (dynamic) {
    commands.splice(
      0,
      commands.length,
      ...visual.points
        .filter(p => p.name !== 'H')
        .map(p => `${p.name}=${coord(p)}`),
      ...(visual.segments ?? []).map(
        ([a, b], i) => `seg${i}=Segment(${a},${b})`,
      ),
    );
    commands.push('baseAB=Line(A,B)', 'baseBC=Line(B,C)');
    hidden.push('baseAB', 'baseBC');
    const vertices = ['C', 'A'];
    for (const [i] of (visual.constructions ?? []).entries()) {
      const v = vertices[i],
        base = v === 'C' ? 'baseAB' : 'baseBC';
      commands.push(
        `alt${v}=PerpendicularLine(${v},${base})`,
        `foot${v}=Intersect(alt${v},${base})`,
        `construction${i}=Segment(${v},foot${v})`,
        `right${i}=Angle(${base},alt${v})`,
      );
      hidden.push(`alt${v}`, `foot${v}`);
    }
    if (visual.extensions?.length) commands.push('extension0=Line(B,C)');
    if (visual.lines?.length)
      commands.push(
        'line0=PerpendicularLine(C,baseAB)',
        'line1=PerpendicularLine(A,baseBC)',
        'H=Intersect(line0,line1)',
      );
  }
  const objects = commands.map(c => c.split(/[=:]/)[0]);
  // The official loader sets inline sizes; the host must follow the iframe viewport.
  return `<!doctype html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><style>html,body{margin:0;background:#f7f6fd;overflow:hidden}#ggb{width:100vw!important;height:100vh!important;overflow:hidden}#comparison-notice{position:absolute;top:8px;left:8px;right:8px;padding:10px;background:#f7f6fd;color:#2a2442;border:1px solid #6f42ca;border-radius:10px;font:14px/1.4 Arial,sans-serif}</style></head><body><div id="ggb"></div>${comparison ? '<p id="comparison-notice" role="status" hidden></p>' : ''}<script src="https://www.geogebra.org/apps/deployggb.js" onerror="parent.postMessage({kind:'geometry-ggb',status:'failed'},'*')"></script><script>
  try { const applet = new GGBApplet({appName:'classic',width:window.innerWidth,height:window.innerHeight,language:'pt',showToolBar:false,showAlgebraInput:false,showMenuBar:false,showResetIcon:false,showZoomButtons:true,enableRightClick:false,allowStyleBar:false,showSuggestionButtons:false,preventFocus:true,disableAutoScale:true,appletOnLoad(api){
    try {
      api.setPerspective('G'); api.setAxesVisible(false,false); api.setGridVisible(false);
      for(const command of ${JSON.stringify(commands)}){if(!api.evalCommand(command))throw new Error('construction');}
      for(const name of ${JSON.stringify(objects)}){api.setLabelVisible(name,false);api.setFixed(name,true,false);api.setLineThickness(name,4);api.setColor(name,111,66,202);if(/construction|right|tick/.test(name))api.setColor(name,89,122,16);if(/extension/.test(name))api.setLineStyle(name,1);if(/right/.test(name))api.setLabelStyle(name,2);}
      for(const name of ${JSON.stringify(hidden)})api.setVisible(name,false);
      for(const name of ${JSON.stringify(dynamic || comparison ? objects.filter(n => /^right/.test(n)) : [])})api.setLabelVisible(name,true);
      for(const name of ${JSON.stringify(names)}){api.setLabelVisible(name,true);api.setLabelStyle(name,0);api.setPointSize(name,5);api.setColor(name,42,36,66);if(${dynamic || comparison}&&['A','B','C'].includes(name))api.setFixed(name,false,true);}
      ${comparison && visual.exploration !== 'comparison-altitude' ? "api.evalCommand('SetDecoration(partAM,1)');api.evalCommand('SetDecoration(partMB,1)');" : ''}
      ${comparison ? `window.geometryComparisonNotice=()=>{const a={x:api.getXcoord('A'),y:api.getYcoord('A')},b={x:api.getXcoord('B'),y:api.getYcoord('B')},c={x:api.getXcoord('C'),y:api.getYcoord('C')};const cross=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);const scale=Math.max(1,Math.hypot(b.x-a.x,b.y-a.y)*Math.hypot(c.x-a.x,c.y-a.y));const notice=document.getElementById('comparison-notice');notice.hidden=Math.abs(cross)>1e-9*scale;notice.textContent='Os pontos estão alinhados ou coincidem. Afaste um vértice para voltar a formar um triângulo.';};api.registerUpdateListener('geometryComparisonNotice');window.geometryComparisonNotice();` : ''}
      const resize=()=>{const width=window.innerWidth,height=window.innerHeight;api.setSize(width,height);const cx=${(frame.minX + frame.maxX) / 2},cy=${(frame.minY + frame.maxY) / 2},spanY=${frame.maxY - frame.minY};const spanX=spanY*width/height;api.setCoordSystem(cx-spanX/2,cx+spanX/2,cy-spanY/2,cy+spanY/2);};
      resize();window.addEventListener('resize',resize);
      parent.postMessage({kind:'geometry-ggb',status:'ready'},'*');
    }catch{parent.postMessage({kind:'geometry-ggb',status:'failed'},'*');}
  }},true); applet.inject('ggb'); }catch{parent.postMessage({kind:'geometry-ggb',status:'failed'},'*');}
  </script></body></html>`;
}
