import { describe, expect, it } from 'vitest';
import { money, readableText } from './utils';

describe('display utilities', () => {
  it('formats money consistently', () => expect(money(12.5)).toBe('$12.50'));
  it('selects readable text for category colors', () => {
    expect(readableText('#FBF6EE')).toBe('#2B1B14');
    expect(readableText('#2B1B14')).toBe('#fff');
  });
});
