import { Injectable, Optional, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { JwtPayload } from "../interfaces/jwt-payload.interface.js";
import type { AuthenticatedUser } from "../interfaces/authenticated-user.interface.js";
import { PrismaService } from "../../database/prisma.service.js";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    config: ConfigService,
    @Optional() private readonly prisma?: PrismaService,
  ) {
    const secret =
      config.get<string>("JWT_ACCESS_SECRET") ??
      config.get<string>("JWT_SECRET") ??
      "dev-access-secret-campusos-fallback";

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * Passport attaches the return value to `req.user`.
   * Validates active account status in the database to prevent stale claims
   * and disallow deactivated accounts from accessing authenticated endpoints.
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload?.sub || !payload?.email) {
      throw new UnauthorizedException("Invalid token payload");
    }

    if (this.prisma) {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true, isActive: true },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException(
          "User account is inactive or not found",
        );
      }

      return {
        id: user.id,
        email: user.email,
        role: user.role,
      };
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
