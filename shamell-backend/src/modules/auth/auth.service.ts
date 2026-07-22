import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { compare, hash } from 'bcryptjs';
import { createHash, randomBytes, randomInt } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildAdminInviteEmailHtml,
  buildAdminInviteEmailText,
} from '../mail/admin-invite.mail';
import { emailBrandingFromConfig } from '../mail/email-html-branding';
import { MailService } from '../mail/mail.service';
import {
  deriveAdminPermissions,
  isAdminStaffRole,
} from '../../common/auth/admin-permissions';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { BootstrapAdminDto } from './dto/bootstrap-admin.dto';
import { InviteAdminDto } from './dto/invite-admin.dto';
import { VerifyAdminInviteDto } from './dto/verify-admin-invite.dto';

const INVITE_TTL_MS = 48 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly googleClient: OAuth2Client | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {
    const googleClientId = this.config.get<string>('GOOGLE_CLIENT_ID')?.trim();
    this.googleClient = googleClientId
      ? new OAuth2Client(googleClientId)
      : null;
  }

  private async signAdminAccessToken(user: {
    id: string;
    email: string;
    role: string;
  }) {
    const permissions = deriveAdminPermissions(user.role);
    return this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions,
    });
  }

  private adminLoginUserPayload(user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  }) {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      permissions: deriveAdminPermissions(user.role),
    };
  }

  async bootstrapAdmin(dto: BootstrapAdminDto, providedSecret?: string) {
    const expectedSecret = this.config
      .get<string>('BOOTSTRAP_ADMIN_SECRET')
      ?.trim();
    if (!expectedSecret) {
      throw new ForbiddenException('Admin bootstrap is disabled.');
    }

    const headerSecret = providedSecret?.trim();
    if (!headerSecret || headerSecret !== expectedSecret) {
      throw new UnauthorizedException('Invalid bootstrap secret.');
    }

    const existingAdmin = await this.prisma.user.findFirst({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
      select: { id: true },
    });
    if (existingAdmin) {
      throw new ForbiddenException('Bootstrap already completed.');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      select: { id: true },
    });
    if (existingUser) {
      throw new ConflictException('Email is already registered.');
    }

    const passwordHash = await hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email.toLowerCase(),
        password: passwordHash,
        phone: dto.phone,
        role: 'SUPER_ADMIN',
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    return {
      message: 'Admin account created successfully.',
      user: {
        ...user,
        permissions: deriveAdminPermissions(user.role),
      },
    };
  }

  async loginAdmin(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password) {
      throw new UnauthorizedException('Use Google sign-in for this account.');
    }

    const isPasswordValid = await compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!isAdminStaffRole(user.role)) {
      throw new ForbiddenException('Only admin accounts can sign in.');
    }

    if (user.twoFactorEnabled) {
      if (!dto.twoFactorCode || dto.twoFactorCode !== user.twoFactorSecret) {
        throw new UnauthorizedException('Invalid 2FA code');
      }
    }

    const accessToken = await this.signAdminAccessToken(user);

    return {
      message: 'Login successful',
      accessToken,
      user: this.adminLoginUserPayload(user),
    };
  }

  async loginAdminGoogle(idToken: string) {
    const { email, sub } = await this.verifyGoogleIdToken(idToken);

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !isAdminStaffRole(user.role)) {
      throw new UnauthorizedException(
        'No admin account for this Google email.',
      );
    }

    if (user.googleSub && user.googleSub !== sub) {
      throw new UnauthorizedException(
        'Google account does not match this profile.',
      );
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException(
        '2FA is enabled; use email and password with 2FA code.',
      );
    }

    if (!user.googleSub) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { googleSub: sub },
      });
    }

    const accessToken = await this.signAdminAccessToken(user);

    return {
      message: 'Login successful',
      accessToken,
      user: this.adminLoginUserPayload(user),
    };
  }

  async inviteAdmin(inviterId: string, dto: InviteAdminDto) {
    if (!this.mail.isConfigured()) {
      throw new BadRequestException(this.mail.getMissingConfigMessage());
    }

    const inviter = await this.prisma.user.findUnique({
      where: { id: inviterId },
      select: { id: true, role: true },
    });
    if (
      !inviter ||
      !deriveAdminPermissions(inviter.role).includes('admin.invite')
    ) {
      throw new ForbiddenException('Invalid inviter.');
    }

    const email = dto.email.toLowerCase();
    const fullName = dto.fullName.trim();

    const existing = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(
        'This email is already registered. Use another email.',
      );
    }

    await this.prisma.adminInvite.deleteMany({
      where: { email, consumedAt: null },
    });

    const code = String(randomInt(100000, 1000000));
    const codeHash = createHash('sha256').update(code, 'utf8').digest('hex');
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

    const invite = await this.prisma.adminInvite.create({
      data: {
        email,
        codeHash,
        fullName,
        invitedById: inviterId,
        expiresAt,
      },
      select: { id: true },
    });

    const appName =
      this.config.get<string>('APP_PUBLIC_NAME')?.trim() ?? 'Shamell Admin';
    const branding = emailBrandingFromConfig(this.config);
    const emailHtml = buildAdminInviteEmailHtml({
      appName,
      fullName,
      code,
      branding,
    });
    const emailText = buildAdminInviteEmailText({
      appName,
      fullName,
      code,
    });

    const subject = `${appName} — código para crear tu cuenta de administrador`;
    const result = await this.mail.sendTransactional({
      to: email,
      toName: fullName,
      subject,
      html: emailHtml,
      text: emailText,
    });

    if (!result.ok) {
      await this.prisma.adminInvite
        .delete({ where: { id: invite.id } })
        .catch(() => null);
      const raw = result.errorText ?? '';
      const friendly = MailService.userFacingErrorMessage(
        raw,
        this.mail.resolveFromEmail(),
      );
      if (friendly) {
        throw new BadRequestException(friendly);
      }
      throw new InternalServerErrorException(
        raw || 'Failed to send verification email.',
      );
    }

    return {
      message:
        'Verification code sent. Complete adding the admin in Shamell Admin → Agregar administrador with this email, the code, and a password.',
      email,
    };
  }

  async verifyAdminInvite(dto: VerifyAdminInviteDto) {
    const email = dto.email.toLowerCase();

    const invite = await this.prisma.adminInvite.findFirst({
      where: {
        email,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!invite) {
      throw new UnauthorizedException('Invalid or expired invitation.');
    }

    const digest = createHash('sha256')
      .update(dto.code.trim(), 'utf8')
      .digest('hex');
    if (digest !== invite.codeHash) {
      throw new UnauthorizedException('Invalid verification code.');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingUser) {
      throw new ConflictException('This email is already registered.');
    }

    const passwordHash = await hash(dto.password, 10);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          email,
          fullName: invite.fullName,
          password: passwordHash,
          role: 'ADMIN',
        },
      });
      const consumed = await tx.adminInvite.updateMany({
        where: { id: invite.id, consumedAt: null },
        data: { consumedAt: new Date() },
      });
      if (consumed.count !== 1) {
        throw new ConflictException('Invitation was already used.');
      }
    });

    return {
      message:
        'Admin account activated. You can sign in with email and password.',
      email,
    };
  }

  /** First origin from FRONTEND_URL (comma-separated list for CORS). */
  private frontendOrigin(): string {
    const raw = this.config.get<string>('FRONTEND_URL')?.trim();
    const first = raw?.split(',')[0]?.trim();
    return first || 'http://localhost:3000';
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const message =
      'If this email exists, a secure recovery link has been sent.';
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      select: { id: true },
    });

    let rawToken: string | null = null;

    if (user) {
      rawToken = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: tokenHash,
          passwordResetExpiresAt: expiresAt,
        },
      });
    }

    const response: { message: string; resetLink?: string } = { message };

    const nodeEnv =
      this.config.get<string>('NODE_ENV')?.trim() ?? 'development';
    if (nodeEnv !== 'production' && rawToken) {
      const resetLink = `${this.frontendOrigin()}/forgot-password/reset?token=${encodeURIComponent(rawToken)}`;
      response.resetLink = resetLink;
      this.logger.log(
        `[dev] Password reset link for ${dto.email.toLowerCase()}: ${resetLink}`,
      );
    }

    return response;
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = createHash('sha256').update(dto.token).digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: tokenHash,
        passwordResetExpiresAt: {
          gt: new Date(),
        },
      },
      select: { id: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired recovery token');
    }

    const passwordHash = await hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: passwordHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });

    return { message: 'Password updated successfully' };
  }

  private async verifyGoogleIdToken(
    idToken: string,
  ): Promise<{ email: string; sub: string; name?: string }> {
    const audience = this.config.get<string>('GOOGLE_CLIENT_ID')?.trim();
    if (!this.googleClient || !audience) {
      throw new BadRequestException(
        'Google sign-in is not configured. Set GOOGLE_CLIENT_ID.',
      );
    }

    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience,
    });

    const payload = ticket.getPayload();
    if (!payload?.email || !payload.email_verified || !payload.sub) {
      throw new UnauthorizedException('Google email could not be verified.');
    }

    return {
      email: payload.email.toLowerCase(),
      sub: payload.sub,
      name: payload.name ?? undefined,
    };
  }
}
