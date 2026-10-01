import { describe, expect, it } from 'vitest';
import { safeNextPath } from '@/utilities/safe-next-path';

describe('safeNextPath', () => {
  it('keeps same-site paths with a query', () => {
    expect(safeNextPath('/admin/orders?page=2')).toBe('/admin/orders?page=2');
  });

  it.each(['//evil.com', 'https://evil.com', '/\\evil.com', 'admin', '', null, undefined])('falls back for %s', (value) => {
    expect(safeNextPath(value)).toBe('/admin/orders');
  });
});
