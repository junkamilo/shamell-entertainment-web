import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { Resend } from 'resend';
import { compare, hash } from 'bcryptjs';
import { createHash, randomBytes, randomInt } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { BootstrapAdminDto } from './dto/bootstrap-admin.dto';
import { InviteAdminDto } from './dto/invite-admin.dto';
import { VerifyAdminInviteDto } from './dto/verify-admin-invite.dto';

const INVITE_TTL_MS = 48 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {
    const googleClientId = this.config.get<string>('GOOGLE_CLIENT_ID')?.trim();
    this.googleClient = googleClientId
      ? new OAuth2Client(googleClientId)
      : null;
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
      where: { role: 'ADMIN' },
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
        role: 'ADMIN',
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
      user,
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

    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admin accounts can sign in.');
    }

    if (user.twoFactorEnabled) {
      if (!dto.twoFactorCode || dto.twoFactorCode !== user.twoFactorSecret) {
        throw new UnauthorizedException('Invalid 2FA code');
      }
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      message: 'Login successful',
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    };
  }

  async loginAdminGoogle(idToken: string) {
    const { email, sub } = await this.verifyGoogleIdToken(idToken);

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.role !== 'ADMIN') {
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

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      message: 'Login successful',
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    };
  }

  async inviteAdmin(inviterId: string, dto: InviteAdminDto) {
    const resendKey = this.config.get<string>('RESEND_API_KEY')?.trim();
    const fromEmail =
      this.config.get<string>('RESEND_FROM_EMAIL')?.trim() ??
      'onboarding@resend.dev';

    if (!resendKey) {
      throw new BadRequestException(
        'Email delivery is not configured. Set RESEND_API_KEY (and optionally RESEND_FROM_EMAIL).',
      );
    }

    const inviter = await this.prisma.user.findUnique({
      where: { id: inviterId },
      select: { id: true, role: true },
    });
    if (!inviter || inviter.role !== 'ADMIN') {
      throw new ForbiddenException('Invalid inviter.');
    }

    const email = dto.email.toLowerCase();

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
        fullName: dto.fullName.trim(),
        invitedById: inviterId,
        expiresAt,
      },
      select: { id: true },
    });

    const appName =
      this.config.get<string>('APP_PUBLIC_NAME')?.trim() ?? 'Shamell Admin';

    try {
      const resend = new Resend(resendKey);
      const from =
        fromEmail.includes('<') || fromEmail.includes('>')
          ? fromEmail
          : `${appName} <${fromEmail}>`;

      const { error } = await resend.emails.send({
        from,
        to: email,
        subject: `${appName} — código para crear tu cuenta de administrador`,
        html: `
          <p>Hola ${this.escapeHtml(dto.fullName.trim())},</p>
          <p>Se está dando de alta tu cuenta de administrador. Tu código de verificación es:</p>
          <p style="font-size:28px;font-weight:bold;letter-spacing:4px;">${code}</p>
          <p>Comparte este código con quien completa el alta en el panel (Shamell Admin → Agregar administrador), junto con la contraseña que definirán para tu cuenta.</p>
          <p>Este código caduca en 48 horas.</p>
        `,
      });

      if (error) {
        await this.prisma.adminInvite
          .delete({ where: { id: invite.id } })
          .catch(() => null);
        const raw = (
          typeof error.message === 'string' ? error.message : ''
        ).trim();
        if (/only send testing emails|verify a domain/i.test(raw)) {
          throw new BadRequestException(
            'Resend está en modo de prueba: solo puedes enviar a la dirección asociada a tu cuenta de Resend, o verifica un dominio en https://resend.com/domains y configura RESEND_FROM_EMAIL con un remitente de ese dominio para enviar el código a cualquier correo.',
          );
        }
        throw new InternalServerErrorException(
          raw || 'No se pudo enviar el correo de invitación.',
        );
      }
    } catch (err) {
      await this.prisma.adminInvite
        .delete({ where: { id: invite.id } })
        .catch(() => null);
      if (
        err instanceof InternalServerErrorException ||
        err instanceof BadRequestException
      ) {
        throw err;
      }
      throw new InternalServerErrorException(
        'Failed to send verification email.',
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

  async completeAdminInviteGoogle(idToken: string) {
    const { email, sub, name } = await this.verifyGoogleIdToken(idToken);

    const invite = await this.prisma.adminInvite.findFirst({
      where: {
        email,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!invite) {
      throw new UnauthorizedException(
        'No pending invitation for this Google email.',
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingUser) {
      throw new ConflictException('This email is already registered.');
    }

    const displayName =
      invite.fullName.trim() || name?.trim() || email.split('@')[0];

    const newUser = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email,
          fullName: displayName,
          password: null,
          googleSub: sub,
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
      return u;
    });

    const accessToken = await this.jwtService.signAsync({
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    return {
      message: 'Admin account activated.',
      accessToken,
      user: {
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
      },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      select: { id: true },
    });

    if (user) {
      const rawToken = randomBytes(32).toString('hex');
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

    return {
      message: 'If this email exists, a secure recovery link has been sent.',
    };
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

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
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
