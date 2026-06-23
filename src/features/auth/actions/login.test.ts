import { ErrorCode } from "@/shared/lib/actions/result";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/shared/lib/realtime/board-events", () => ({ publishBoardEvent: vi.fn() }));
vi.mock("@/shared/lib/auth/dal", () => ({ verifySession: vi.fn() }));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    const error = new Error("NEXT_REDIRECT") as Error & { digest: string };
    error.digest = `NEXT_REDIRECT;replace;${url};307;`;
    throw error;
  }),
}));

const sessionMock = vi.hoisted(() => ({ createSession: vi.fn() }));
vi.mock("@/shared/lib/auth/session", () => sessionMock);

const rateLimitMock = vi.hoisted(() => ({
  checkRateLimit: vi.fn(async () => true),
  getClientIp: vi.fn(async () => "1.2.3.4"),
}));
vi.mock("@/shared/lib/auth/rate-limit", () => rateLimitMock);

const bcryptMock = vi.hoisted(() => ({ compare: vi.fn() }));
vi.mock("bcrypt", () => ({ default: bcryptMock }));

const prismaMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
}));
vi.mock("@/shared/lib/db/prisma", () => ({ prisma: prismaMock }));

import { redirect } from "next/navigation";
import { login } from "./login";

const baseInput = { email: "ada@example.com", password: "supersecret" };

beforeEach(() => {
  vi.clearAllMocks();
  rateLimitMock.checkRateLimit.mockResolvedValue(true);
  rateLimitMock.getClientIp.mockResolvedValue("1.2.3.4");
  bcryptMock.compare.mockResolvedValue(true);
  prismaMock.user.findUnique.mockResolvedValue({ id: "user-1", passwordHash: "stored-hash" });
});

describe("login", () => {
  it("returns RATE_LIMITED when the per-IP window is exhausted", async () => {
    rateLimitMock.checkRateLimit.mockResolvedValueOnce(false); // first (IP) check fails

    const result = await login(baseInput);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.RATE_LIMITED);
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("returns RATE_LIMITED when the per-account window is exhausted", async () => {
    rateLimitMock.checkRateLimit
      .mockResolvedValueOnce(true) // IP check passes
      .mockResolvedValueOnce(false); // account check fails

    const result = await login(baseInput);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.RATE_LIMITED);
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("returns INVALID_CREDENTIALS when the user does not exist", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const result = await login(baseInput);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.INVALID_CREDENTIALS);
    expect(sessionMock.createSession).not.toHaveBeenCalled();
  });

  it("returns INVALID_CREDENTIALS when the password does not match", async () => {
    bcryptMock.compare.mockResolvedValue(false);

    const result = await login(baseInput);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.INVALID_CREDENTIALS);
    expect(sessionMock.createSession).not.toHaveBeenCalled();
  });

  it("starts a session and redirects on valid credentials", async () => {
    await expect(login(baseInput)).rejects.toMatchObject({
      digest: expect.stringContaining("NEXT_REDIRECT"),
    });

    expect(bcryptMock.compare).toHaveBeenCalledWith("supersecret", "stored-hash");
    expect(sessionMock.createSession).toHaveBeenCalledWith("user-1");
    expect(redirect).toHaveBeenCalledWith("/boards");
  });
});
