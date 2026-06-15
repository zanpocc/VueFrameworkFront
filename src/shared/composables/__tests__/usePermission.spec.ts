import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePermission } from '../usePermission';

// Mock the auth store
const mockHasPermission = vi.fn();
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    hasPermission: mockHasPermission,
  }),
}));

describe('usePermission', () => {
  beforeEach(() => {
    mockHasPermission.mockReset();
  });

  it('returns true when user has the permission', () => {
    mockHasPermission.mockReturnValue(true);
    const { hasPermission } = usePermission();
    expect(hasPermission('system:user:create')).toBe(true);
    expect(mockHasPermission).toHaveBeenCalledWith('system:user:create');
  });

  it('returns false when user lacks the permission', () => {
    mockHasPermission.mockReturnValue(false);
    const { hasPermission } = usePermission();
    expect(hasPermission('system:user:delete')).toBe(false);
  });

  it('checks all codes in an array (AND logic)', () => {
    mockHasPermission.mockReturnValue(true);
    const { hasPermission } = usePermission();
    expect(hasPermission(['perm1', 'perm2'])).toBe(true);
    expect(mockHasPermission).toHaveBeenCalledWith('perm1');
    expect(mockHasPermission).toHaveBeenCalledWith('perm2');

    mockHasPermission.mockImplementation((code: string) => code === 'perm1');
    expect(hasPermission(['perm1', 'perm2'])).toBe(false);
  });
});
