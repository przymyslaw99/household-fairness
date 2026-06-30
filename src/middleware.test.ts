import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn();
const getCurrentUserHouseholdMembershipMock = vi.fn();

vi.mock("astro:middleware", () => ({
  defineMiddleware: (handler: unknown) => handler,
}));

vi.mock("@/lib/supabase", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/household/repository", () => ({
  getCurrentUserHouseholdMembership: getCurrentUserHouseholdMembershipMock,
}));

const { onRequest } = await import("./middleware");

describe("middleware protected routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects anonymous invite-management requests to sign in", async () => {
    createClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    });

    const redirect = vi.fn((location: string) => location);
    const next = vi.fn();

    const response = await onRequest(
      {
        url: new URL("https://household-fairness.local/household/invite"),
        request: { headers: new Headers() },
        cookies: {},
        locals: {},
        redirect,
      },
      next,
    );

    expect(redirect).toHaveBeenCalledWith("/auth/signin");
    expect(next).not.toHaveBeenCalled();
    expect(response).toBe("/auth/signin");
  });

  it("redirects signed-in users away from the sign-in page to the home page", async () => {
    createClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
    });
    getCurrentUserHouseholdMembershipMock.mockResolvedValue({
      data: { householdId: "household-1" },
      error: null,
    });

    const redirect = vi.fn((location: string) => location);
    const next = vi.fn();

    const response = await onRequest(
      {
        url: new URL("https://household-fairness.local/auth/signin"),
        request: { headers: new Headers() },
        cookies: {},
        locals: {},
        redirect,
      },
      next,
    );

    expect(getCurrentUserHouseholdMembershipMock).not.toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/");
    expect(next).not.toHaveBeenCalled();
    expect(response).toBe("/");
  });

  it("redirects signed-in users away from the sign-up page to the home page", async () => {
    createClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
    });

    const redirect = vi.fn((location: string) => location);
    const next = vi.fn();

    const response = await onRequest(
      {
        url: new URL("https://household-fairness.local/auth/signup"),
        request: { headers: new Headers() },
        cookies: {},
        locals: {},
        redirect,
      },
      next,
    );

    expect(getCurrentUserHouseholdMembershipMock).not.toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/");
    expect(next).not.toHaveBeenCalled();
    expect(response).toBe("/");
  });

  it("redirects signed-in users away from the confirm-email page to the home page", async () => {
    createClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
    });

    const redirect = vi.fn((location: string) => location);
    const next = vi.fn();

    const response = await onRequest(
      {
        url: new URL("https://household-fairness.local/auth/confirm-email"),
        request: { headers: new Headers() },
        cookies: {},
        locals: {},
        redirect,
      },
      next,
    );

    expect(getCurrentUserHouseholdMembershipMock).not.toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/");
    expect(next).not.toHaveBeenCalled();
    expect(response).toBe("/");
  });
});
