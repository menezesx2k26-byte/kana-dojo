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
  };
}
/** Only authored construction data enters this document, never user input or storage. */
export function geogebraDocument(visual: Visual): string {
  const commands = [
    ...visual.points.map(p => `${p.name}=(${p.x},${p.y})`),
    ...(visual.segments ?? []).map(([a, b], i) => `seg${i}=Segment(${a},${b})`),
    ...(visual.lines ?? []).map((l, i) => `line${i}:${l.equation}`),
  ];
  const names = visual.points.map(p => p.name);
  return `<!doctype html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><style>html,body{margin:0;background:#faf9f4}#ggb{width:100%;height:360px;overflow:hidden}</style></head><body><div id="ggb"></div><script src="https://www.geogebra.org/apps/deployggb.js" onerror="parent.postMessage({kind:'geometry-ggb',status:'failed'},'*')"></script><script>
  try { const applet = new GGBApplet({appName:'classic',width:600,height:360,language:'pt',showToolBar:false,showAlgebraInput:false,showMenuBar:false,showResetIcon:false,showZoomButtons:true,enableRightClick:false,allowStyleBar:false,showSuggestionButtons:false,preventFocus:true,appletOnLoad(api){
    api.setPerspective('G'); api.setAxesVisible(true,true); api.setGridVisible(true); api.setCoordSystem(-9,13,-8,10);
    for(const command of ${JSON.stringify(commands)}){if(!api.evalCommand(command))throw new Error('construction');}
    for(const name of ${JSON.stringify(names)}){api.setLabelVisible(name,true);api.setLabelStyle(name,0);api.setPointSize(name,5);api.setColor(name,52,104,78);}
    ${JSON.stringify(commands.map((_c, i) => i))}.forEach(i=>{ const name=i<${names.length}?${JSON.stringify(names)}[i]:'';if(name)api.setFixed(name,true,false); });
    parent.postMessage({kind:'geometry-ggb',status:'ready'},'*');
  }},true); applet.inject('ggb'); }catch{parent.postMessage({kind:'geometry-ggb',status:'failed'},'*');}
  </script></body></html>`;
}
