import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AdminJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | undefined> }>();
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid authorization header.',
      );
    }

    const token = authorizationHeader.slice(7).trim();
    if (!token) {
      throw new UnauthorizedException('Authentication token is required.');
    }

    const payload = await this.jwtService
      .verifyAsync<{ sub?: string; email?: string; role?: string }>(token)
      .catch(() => null);
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid or expired token.');
    }

    if (payload.role !== 'ADMIN') {
      throw new ForbiddenException('Admin role is required.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true },
    });
    if (!user || user.role !== 'ADMIN') {
      throw new UnauthorizedException('Admin account is not valid.');
    }

    (
      request as {
        adminUser?: { id: string; email?: string; role?: string };
      }
    ).adminUser = {
      id: user.id,
      email: user.email ?? payload.email,
      role: user.role,
    };

    return true;
  }
}
