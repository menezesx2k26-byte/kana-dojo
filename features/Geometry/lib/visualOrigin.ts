/** A separate, answer-free origin is required by GeoGebra's nested GWT frames. */
export const visualOrigin =
  process.env.NEXT_PUBLIC_GEOMETRY_VISUAL_ORIGIN ?? 'http://127.0.0.1:3101';
export function isolatedVisualURL(
  parentOrigin: string,
  stage: string,
): string | undefined {
  const allowed =
    /^(http:\/\/127\.0\.0\.1:3101|https:\/\/[a-z0-9-]+\.geometria-analitica-dojo(?:-cmk)?\.pages\.dev)$/;
  if (!allowed.test(visualOrigin) || visualOrigin === parentOrigin)
    return undefined;
  return `${visualOrigin}/geogebra.html#${stage}`;
}
