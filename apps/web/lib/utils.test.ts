import { cn } from './utils';

describe('cn', () => {
  it('joins truthy class names', () => {
    expect(cn('a', 'b', false && 'c', undefined, 'd')).toBe('a b d');
  });

  it('merges conflicting tailwind classes, keeping the last one', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });
});
