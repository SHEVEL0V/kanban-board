import { ErrorCode } from "@/shared/lib/actions/result";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/shared/lib/realtime/board-events", () => ({ publishBoardEvent: vi.fn() }));
vi.mock("@/shared/lib/auth/dal", () => ({ verifySession: vi.fn() }));

// redirect() never returns — it throws a NEXT_REDIRECT error that runAction
// recognises and re-throws.
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

const bcryptMock = vi.hoisted(() => ({ hash: vi.fn(async () => "hashed-pw") }));
vi.mock("bcrypt", () => ({ default: bcryptMock }));

const prismaMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), create: vi.fn() },
}));
vi.mock("@/shared/lib/db/prisma", () => ({ prisma: prismaMock }));

import { redirect } from "next/navigation";
import { register } from "./register";

const baseInput = { name: "Ada Lovelace", email: "ada@example.com", password: "supersecret" };

beforeEach(() => {
  vi.clearAllMocks();
  rateLimitMock.checkRateLimit.mockResolvedValue(true);
  rateLimitMock.getClientIp.mockResolvedValue("1.2.3.4");
  bcryptMock.hash.mockResolvedValue("hashed-pw");
  prismaMock.user.findUnique.mockResolvedValue(null);
  prismaMock.user.create.mockResolvedValue({ id: "user-new" });
});

describe("register", () => {
  it("returns RATE_LIMITED once the window is exhausted", async () => {
    rateLimitMock.checkRateLimit.mockResolvedValue(false);

    const result = await register(baseInput);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.RATE_LIMITED);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("returns EMAIL_TAKEN when the address already exists", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "existing" });

    const result = await register(baseInput);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.EMAIL_TAKEN);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("hashes the password, starts a session and redirects on success", async () => {
    await expect(register(baseInput)).rejects.toMatchObject({
      digest: expect.stringContaining("NEXT_REDIRECT"),
    });

    expect(bcryptMock.hash).toHaveBeenCalledWith("supersecret", 10);
    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: { name: "Ada Lovelace", email: "ada@example.com", passwordHash: "hashed-pw" },
      select: { id: true },
    });
    expect(sessionMock.createSession).toHaveBeenCalledWith("user-new");
    expect(redirect).toHaveBeenCalledWith("/boards");
  });

  it("normalises the email to lowercase before lookup", async () => {
    await expect(register({ ...baseInput, email: "ADA@Example.COM" })).rejects.toThrow();

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: "ada@example.com" },
    });
  });
});
