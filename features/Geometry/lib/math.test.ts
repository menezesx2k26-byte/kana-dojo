import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  equal,
  parseScalar,
  parsePoint,
  parseLine,
  sameLine,
  samePoint,
  onLine,
} from './math';
describe('exact, bounded math authority', () => {
  it.each([
    ['sqrt(221)/2', 'sqrt(221/4)'],
    ['sqrt(52)/2', 'sqrt(13)'],
    ['3/sqrt(13)', '3*sqrt(13)/13'],
    ['-3/2', '-1.5'],
    ['0', '1-1'],
    ['sqrt(8)+sqrt(2)', '3sqrt(2)'],
  ])('recognizes %s = %s', (a, b) =>
    expect(equal(parseScalar(a), parseScalar(b))).toBe(true),
  );
  it('recognizes equivalent point notations', () =>
    expect(samePoint(parsePoint('(-3/2,1/2)'), parsePoint('(-1,5;0,5)'))).toBe(
      true,
    ));
  it('does not silently approximate radicals', () =>
    expect(equal(parseScalar('sqrt(221)/2'), parseScalar('7.433'))).toBe(
      false,
    ));
  it.each([
    'y=-3x/7-1/7',
    '3x+7y+1=0',
    '-6x-14y-2=0',
    'y+1=(-3/7)(x-2)',
    '(3x+7y+1)/2=0',
  ])('accepts equivalent line %s', line =>
    expect(sameLine(parseLine(line), parseLine('-3x-7y-1=0'))).toBe(true),
  );
  it('accepts a vertical line and rejects degenerate or nonlinear equations', () => {
    expect(onLine(parsePoint('(2,99)'), parseLine('x=2'))).toBe(true);
    for (const s of ['0=0', 'x*x+y=0', 'x/(y+1)=2', 'sqrt(x)=1', 'x^2+y=0'])
      expect(() => parseLine(s)).toThrow();
  });
  it.each([
    'alert(1)',
    'fetch(1)',
    'process.env',
    '1/0',
    'sqrt(-1)',
    '1+',
    '2**3',
    '1e9',
    '9'.repeat(170),
  ])('rejects unsafe/unsupported input %s', s =>
    expect(() => parseScalar(s)).toThrow(),
  );
  it('does not guess comma-delimited ambiguous coordinates', () =>
    expect(() => parsePoint('(1,5,2)')).toThrow(/ambíguas/));
  it('accepts arbitrary nonzero scaling, not a literal bank', () =>
    fc.assert(
      fc.property(
        fc.integer({ min: -40, max: 40 }).filter(n => n !== 0),
        k =>
          sameLine(
            parseLine(`${3 * k}x+${7 * k}y+${k}=0`),
            parseLine('3x+7y+1=0'),
          ),
      ),
    ));
});
