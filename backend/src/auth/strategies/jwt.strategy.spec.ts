import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtStrategy } from "./jwt.strategy.js";
import { UserRole } from "../../generated/prisma/client.js";

describe("JwtStrategy", () => {
  let strategy: JwtStrategy;
  const config = {
    get: vi.fn((key: string) => {
      if (key === "JWT_ACCESS_SECRET")
        return "test-secret-key-12345678901234567890";
      return undefined;
    }),
  } as unknown as ConfigService;

  beforeEach(() => {
    strategy = new JwtStrategy(config);
  });

  it("validates and extracts user from valid payload", async () => {
    const payload = {
      sub: "ea000000-0000-4000-8000-000000000001",
      email: "student@campusos.dev",
      role: UserRole.STUDENT,
    };

    const user = await strategy.validate(payload);
    expect(user).toEqual({
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    });
  });

  it("throws UnauthorizedException on invalid payload", async () => {
    await expect(
      strategy.validate({ sub: "", email: "", role: UserRole.STUDENT }),
    ).rejects.toThrow(UnauthorizedException);
  });

  describe("when PrismaService is injected", () => {
    const prismaMock = {
      user: {
        findUnique: vi.fn(),
      },
    };

    beforeEach(() => {
      strategy = new JwtStrategy(config, prismaMock as any);
    });

    it("returns user with current database role when user is active", async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: "usr-1",
        email: "user@campusos.dev",
        role: UserRole.ADMIN,
        isActive: true,
      });

      const user = await strategy.validate({
        sub: "usr-1",
        email: "user@campusos.dev",
        role: UserRole.STUDENT, // Stale role in JWT
      });

      expect(user).toEqual({
        id: "usr-1",
        email: "user@campusos.dev",
        role: UserRole.ADMIN,
      });
    });

    it("throws UnauthorizedException when user is deactivated in database", async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: "usr-1",
        email: "user@campusos.dev",
        role: UserRole.STUDENT,
        isActive: false,
      });

      await expect(
        strategy.validate({
          sub: "usr-1",
          email: "user@campusos.dev",
          role: UserRole.STUDENT,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("throws UnauthorizedException when user does not exist in database", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        strategy.validate({
          sub: "usr-non-existent",
          email: "ghost@campusos.dev",
          role: UserRole.STUDENT,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
