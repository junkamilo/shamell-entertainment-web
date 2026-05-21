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
import { MailService } from '../mail/mail.service';
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
    if (!this.mail.isConfigured()) {
      throw new BadRequestException(this.mail.getMissingConfigMessage());
    }

    const inviter = await this.prisma.user.findUnique({
      where: { id: inviterId },
      select: { id: true, role: true },
    });
    if (!inviter || inviter.role !== 'ADMIN') {
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
    const emailHtml = this.buildAdminInviteEmailHtml({
      appName,
      fullName,
      code,
    });
    const emailText = this.buildAdminInviteEmailText({
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

    const nodeEnv = this.config.get<string>('NODE_ENV')?.trim() ?? 'development';
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

  private buildAdminInviteEmailHtml({
    appName,
    fullName,
    code,
  }: {
    appName: string;
    fullName: string;
    code: string;
  }): string {
    const safeAppName = this.escapeHtml(appName);
    const safeFullName = this.escapeHtml(fullName);
    const spacedCode = code.split('').join(' ');

    return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeAppName} invitation code</title>
  </head>
  <body style="margin:0;padding:0;background:#07090d;color:#f8f3e7;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      Tu código para crear una cuenta de administrador en ${safeAppName} es ${code}.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:#07090d;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;max-width:620px;border:1px solid rgba(197,165,90,0.35);border-radius:28px;overflow:hidden;background:#0d1118;">
            <tr>
              <td style="padding:34px 28px 22px;text-align:center;background:linear-gradient(135deg,#121722 0%,#07090d 58%,#17120a 100%);border-bottom:1px solid rgba(197,165,90,0.22);">
                <div style="font-size:12px;line-height:1.4;letter-spacing:0.28em;text-transform:uppercase;color:#c5a55a;">${safeAppName}</div>
                <h1 style="margin:14px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.2;font-weight:400;color:#fff8e6;">Admin Invitation</h1>
                <p style="margin:12px auto 0;max-width:420px;font-size:14px;line-height:1.7;color:#d6cfbd;">Se está dando de alta una cuenta de administrador para ti.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:34px 28px 10px;">
                <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#f8f3e7;">Hola ${safeFullName},</p>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.75;color:#d6cfbd;">Usa este código para completar la creación de tu cuenta en el panel de administración de Shamell.</p>
                <div style="margin:0 auto 26px;padding:22px 18px;border:1px solid rgba(197,165,90,0.45);border-radius:22px;background:#111722;text-align:center;">
                  <div style="margin-bottom:10px;font-size:11px;line-height:1.4;letter-spacing:0.22em;text-transform:uppercase;color:#c5a55a;">Verification Code</div>
                  <div style="font-family:'Courier New',Courier,monospace;font-size:38px;line-height:1.15;font-weight:700;letter-spacing:0.2em;color:#f5d27a;">${spacedCode}</div>
                </div>
                <p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#d6cfbd;">Comparte este código con quien completa el alta en <strong style="color:#fff8e6;">Shamell Admin → Agregar administrador</strong>, junto con la contraseña que definirán para tu cuenta.</p>
                <p style="margin:0;font-size:14px;line-height:1.7;color:#d6cfbd;">Este código caduca en <strong style="color:#fff8e6;">48 horas</strong>. Si solicitan un código nuevo, usa siempre el email más reciente.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 32px;">
                <div style="padding:16px 18px;border-radius:18px;background:rgba(197,165,90,0.08);border:1px solid rgba(197,165,90,0.18);">
                  <p style="margin:0;font-size:12px;line-height:1.7;color:#b9b09f;">Security note: this code only activates an administrator account for ${safeAppName}. If you were not expecting this invitation, ignore this email.</p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  }

  private buildAdminInviteEmailText({
    appName,
    fullName,
    code,
  }: {
    appName: string;
    fullName: string;
    code: string;
  }): string {
    return [
      `Hola ${fullName},`,
      '',
      `Tu código para crear una cuenta de administrador en ${appName} es: ${code}`,
      '',
      'Este código caduca en 48 horas.',
      '',
      'Si solicitan un código nuevo, usa siempre el email más reciente.',
      'Si no esperabas esta invitación, puedes ignorar este correo.',
    ].join('\n');
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
