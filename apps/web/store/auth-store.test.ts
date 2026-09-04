import { useAuthStore } from './auth-store';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clear();
  });

  it('starts with no session', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });

  it('stores the session on setSession', () => {
    useAuthStore.getState().setSession({
      user: { id: 'u1', email: 'a@b.com', name: 'A', avatarUrl: null },
      accessToken: 'access',
      refreshToken: 'refresh',
    });

    const state = useAuthStore.getState();
    expect(state.user?.email).toBe('a@b.com');
    expect(state.accessToken).toBe('access');
    expect(state.refreshToken).toBe('refresh');
  });

  it('replaces only the tokens on setTokens', () => {
    useAuthStore.getState().setSession({
      user: { id: 'u1', email: 'a@b.com', name: 'A', avatarUrl: null },
      accessToken: 'old-access',
      refreshToken: 'old-refresh',
    });

    useAuthStore.getState().setTokens({ accessToken: 'new-access', refreshToken: 'new-refresh' });

    const state = useAuthStore.getState();
    expect(state.user?.email).toBe('a@b.com');
    expect(state.accessToken).toBe('new-access');
    expect(state.refreshToken).toBe('new-refresh');
  });

  it('clears everything on clear', () => {
    useAuthStore.getState().setSession({
      user: { id: 'u1', email: 'a@b.com', name: 'A', avatarUrl: null },
      accessToken: 'access',
      refreshToken: 'refresh',
    });

    useAuthStore.getState().clear();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
  });
});
