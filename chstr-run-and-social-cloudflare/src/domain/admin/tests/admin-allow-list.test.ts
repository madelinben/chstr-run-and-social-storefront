import { describe, expect, it } from 'vitest';
import { isAdminEmail } from '@/domain/admin/admin-allow-list';

describe('isAdminEmail', () => {
  it('matches case-insensitively and ignores list whitespace', () => {
    expect(isAdminEmail('Staff@Example.com', ' staff@example.com , other@example.com ')).toBe(true);
  });

  it('rejects addresses that only partly match', () => {
    expect(isAdminEmail('staff@example.com.evil.io', 'staff@example.com')).toBe(false);
    expect(isAdminEmail('evil+staff@example.com', 'staff@example.com')).toBe(false);
  });

  it('admits nobody when the list is empty or unset', () => {
    expect(isAdminEmail('staff@example.com', '')).toBe(false);
    expect(isAdminEmail('staff@example.com', undefined)).toBe(false);
  });
});
