/** Bounded, exact arithmetic. No eval, CAS, network, or approximate approval. */
export interface Rational {
  n: number;
  d: number;
}
export type Scalar = Record<number, Rational>; // square-free radicand -> rational coefficient
export interface Linear {
  c: Scalar;
  x: Scalar;
  y: Scalar;
}
export interface Point {
  x: Scalar;
  y: Scalar;
}
export class MathInputError extends Error {}
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
function rational(n: number, d = 1): Rational {
  if (!d || !Number.isSafeInteger(n) || !Number.isSafeInteger(d))
    throw new MathInputError('Número fora dos limites ou divisão por zero.');
  const g = gcd(n, d);
  return { n: (d < 0 ? -n : n) / g, d: Math.abs(d) / g };
}
const addR = (a: Rational, b: Rational) =>
  rational(a.n * b.d + b.n * a.d, a.d * b.d);
const mulR = (a: Rational, b: Rational) => rational(a.n * b.n, a.d * b.d);
export const scalar = (n: number): Scalar => (n ? { 1: rational(n) } : {});
function term(k: number, coefficient: Rational): Scalar {
  if (!Number.isSafeInteger(k) || k < 1 || k > 1e8)
    throw new MathInputError('Radical fora do limite (10⁸).');
  let factor = 1;
  for (let p = 2; p * p <= k; p++)
    while (k % (p * p) === 0) {
      k /= p * p;
      factor *= p;
    }
  const value = mulR(coefficient, rational(factor));
  return value.n ? { [k]: value } : {};
}
export function add(a: Scalar, b: Scalar): Scalar {
  const r = { ...a };
  for (const [k, v] of Object.entries(b)) {
    r[+k] = addR(r[+k] ?? rational(0), v);
    if (!r[+k].n) delete r[+k];
  }
  return r;
}
export function mul(a: Scalar, b: Scalar): Scalar {
  let r: Scalar = {};
  for (const [ka, va] of Object.entries(a))
    for (const [kb, vb] of Object.entries(b))
      r = add(r, term(+ka * +kb, mulR(va, vb)));
  return r;
}
const neg = (a: Scalar) => mul(a, scalar(-1));
function divide(a: Scalar, b: Scalar): Scalar {
  const entries = Object.entries(b);
  if (entries.length !== 1)
    throw new MathInputError('Use denominador racional ou um único radical.');
  const [k, v] = entries[0];
  return mul(a, term(+k, rational(v.d, v.n * +k)));
}
export function equal(a: Scalar, b: Scalar): boolean {
  return Object.keys(add(a, neg(b))).length === 0;
}
export const approximate = (a: Scalar): number =>
  Object.entries(a).reduce((s, [k, v]) => s + (Math.sqrt(+k) * v.n) / v.d, 0);
const constant = (c: Scalar): Linear => ({ c, x: {}, y: {} });
const isConstant = (v: Linear) =>
  !Object.keys(v.x).length && !Object.keys(v.y).length;
const sum = (a: Linear, b: Linear): Linear => ({
  c: add(a.c, b.c),
  x: add(a.x, b.x),
  y: add(a.y, b.y),
});
const scale = (a: Linear, b: Scalar): Linear => ({
  c: mul(a.c, b),
  x: mul(a.x, b),
  y: mul(a.y, b),
});

export function parseExpression(input: string): Linear {
  let text = input
    .trim()
    .toLowerCase()
    .replace(/[−–]/g, '-')
    .replace(/[×·]/g, '*')
    .replace(/²/g, '^2')
    .replace(/\braiz\b/g, 'sqrt')
    .replace(/√\s*(\d+(?:\.\d+)?)/g, 'sqrt($1)')
    .replace(/√\s*\(/g, 'sqrt(')
    .replace(/\s/g, '');
  if (!text || text.length > 160 || !/^[0-9.xy+*/^()sqrt-]+$/.test(text))
    throw new MathInputError(
      'Use números, x, y, +, −, *, /, parênteses e sqrt(...).',
    );
  const tokens = text.match(/sqrt|(?:\d+(?:\.\d+)?|\.\d+)|[xy()+*/^-]/g) ?? [];
  if (tokens.join('') !== text || tokens.length > 100)
    throw new MathInputError('Notação não reconhecida.');
  let i = 0;
  const take = (token: string) => (tokens[i] === token ? (i++, true) : false);
  function atom(): Linear {
    if (take('+')) return atom();
    if (take('-')) return scale(atom(), scalar(-1));
    if (take('(')) {
      const v = expression();
      if (!take(')')) throw new MathInputError('Feche o parêntese.');
      return power(v);
    }
    if (take('sqrt')) {
      if (!take('(')) throw new MathInputError('Escreva sqrt(221).');
      const v = expression();
      if (!take(')')) throw new MathInputError('Feche o radical.');
      if (!isConstant(v) || Object.keys(v.c).some(k => k !== '1'))
        throw new MathInputError(
          'O radicando deve ser racional, sem variáveis.',
        );
      const r = v.c[1] ?? rational(0);
      if (r.n < 0)
        throw new MathInputError('Use um radical real não negativo.');
      return power(constant(r.n ? term(r.n * r.d, rational(1, r.d)) : {}));
    }
    const t = tokens[i++];
    if (t === 'x' || t === 'y')
      return power({ ...constant({}), [t]: scalar(1) });
    if (!t || !/^(?:\d|\.)/.test(t))
      throw new MathInputError('Falta um número ou uma expressão.');
    const [whole, decimal = ''] = t.split('.');
    if (decimal.length > 6 || +whole > 1e8)
      throw new MathInputError(
        'Use até seis casas decimais e números menores que 10⁸.',
      );
    const number = rational(
      +whole * 10 ** decimal.length + +decimal,
      10 ** decimal.length,
    );
    return power(constant(number.n ? { 1: number } : {}));
  }
  function power(v: Linear): Linear {
    if (!take('^')) return v;
    const exponent = tokens[i++];
    if (exponent !== '2' || !isConstant(v))
      throw new MathInputError(
        'Neste verificador, só aceitamos quadrados de valores numéricos.',
      );
    return constant(mul(v.c, v.c));
  }
  function product(): Linear {
    let v = atom();
    while (i < tokens.length) {
      if (take('/')) {
        const b = atom();
        if (!isConstant(b))
          throw new MathInputError('Não use variável no denominador.');
        v = { c: divide(v.c, b.c), x: divide(v.x, b.c), y: divide(v.y, b.c) };
      } else if (
        take('*') ||
        /^(?:sqrt|\d|\.\d|x|y|\()/.test(tokens[i] ?? '')
      ) {
        const b = atom();
        if (!isConstant(v) && !isConstant(b))
          throw new MathInputError(
            'Este verificador aceita equações lineares, sem produtos de variáveis.',
          );
        v = isConstant(b) ? scale(v, b.c) : scale(b, v.c);
      } else break;
    }
    return v;
  }
  function expression(): Linear {
    let v = product();
    while (i < tokens.length) {
      if (take('+')) v = sum(v, product());
      else if (take('-')) v = sum(v, scale(product(), scalar(-1)));
      else break;
    }
    return v;
  }
  const v = expression();
  if (i !== tokens.length) throw new MathInputError('Revise a notação.');
  text = '';
  return v;
}
export function parseScalar(input: string): Scalar {
  if (input.includes(',')) input = input.replace(/(?<=\d),(?=\d)/g, '.');
  const v = parseExpression(input);
  if (!isConstant(v))
    throw new MathInputError('Esta etapa pede um valor numérico.');
  return v.c;
}
export function parsePoint(input: string): Point {
  const body = input
    .trim()
    .replace(/^[A-Z]\s*=\s*/i, '')
    .replace(/^\(/, '')
    .replace(/\)$/, '');
  const parts = body.includes(';') ? body.split(';') : body.split(',');
  if (parts.length !== 2)
    throw new MathInputError(
      'Coordenadas ambíguas. Use (x; y) com vírgula decimal, ou (x, y) com ponto decimal.',
    );
  return { x: parseScalar(parts[0]), y: parseScalar(parts[1]) };
}
export function parseLine(input: string): Linear {
  const parts = input
    .trim()
    .replace(/^[rs]\s*:\s*/i, '')
    .split('=');
  if (parts.length !== 2)
    throw new MathInputError('Escreva uma equação com =, por exemplo 2x+y=3.');
  const v = sum(
    parseExpression(parts[0]),
    scale(parseExpression(parts[1]), scalar(-1)),
  );
  if (!Object.keys(v.x).length && !Object.keys(v.y).length)
    throw new MathInputError(
      'A equação precisa definir uma reta: x ou y deve ter coeficiente não nulo.',
    );
  return v;
}
export function onLine(point: Point, line: Linear): boolean {
  return equal(
    add(add(mul(point.x, line.x), mul(point.y, line.y)), line.c),
    {},
  );
}
export function sameLine(a: Linear, b: Linear): boolean {
  return (
    equal(mul(a.x, b.y), mul(b.x, a.y)) &&
    equal(mul(a.x, b.c), mul(b.x, a.c)) &&
    equal(mul(a.y, b.c), mul(b.y, a.c))
  );
}
export function samePoint(a: Point, b: Point): boolean {
  return equal(a.x, b.x) && equal(a.y, b.y);
}
export function formatScalar(a: Scalar): string {
  return (
    Object.entries(a)
      .map(
        ([k, v]) =>
          `${v.n}${k === '1' ? '' : `√${k}`}${v.d === 1 ? '' : `/${v.d}`}`,
      )
      .join(' + ')
      .replace(/\+ -/g, '− ') || '0'
  );
}
