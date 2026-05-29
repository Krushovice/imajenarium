import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "@/store/auth.store";

const mockUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "user@example.com",
  username: "john",
  displayName: "John Doe",
  isGuest: false,
};

beforeEach(() => {
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false });
});

describe("useAuthStore", () => {
  it("initial state is unauthenticated", () => {
    const { user, accessToken, isAuthenticated } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(accessToken).toBeNull();
    expect(isAuthenticated).toBe(false);
  });

  it("setUser sets user and marks authenticated", () => {
    useAuthStore.getState().setUser(mockUser);
    const { user, isAuthenticated } = useAuthStore.getState();
    expect(user).toEqual(mockUser);
    expect(isAuthenticated).toBe(true);
  });

  it("setAccessToken stores token", () => {
    useAuthStore.getState().setAccessToken("my.jwt.token");
    expect(useAuthStore.getState().accessToken).toBe("my.jwt.token");
  });

  it("logout clears all auth state", () => {
    useAuthStore.getState().setUser(mockUser);
    useAuthStore.getState().setAccessToken("my.jwt.token");
    useAuthStore.getState().logout();

    const { user, accessToken, isAuthenticated } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(accessToken).toBeNull();
    expect(isAuthenticated).toBe(false);
  });

  it("setUser overwrites previous user", () => {
    useAuthStore.getState().setUser(mockUser);
    const newUser = { ...mockUser, displayName: "Jane" };
    useAuthStore.getState().setUser(newUser);
    expect(useAuthStore.getState().user?.displayName).toBe("Jane");
  });

  it("isAuthenticated false after logout even if token was set", () => {
    useAuthStore.getState().setUser(mockUser);
    useAuthStore.getState().setAccessToken("token");
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
