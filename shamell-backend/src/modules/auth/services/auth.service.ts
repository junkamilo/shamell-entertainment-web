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
import { softFailToNull } from '../../../common/http/utils/log-caught-error.util';
import {
  deriveAdminPermissions,
  isAdminStaffRole,
} from '../../../common/auth/constants/admin-permissions.constants';
import {
  buildAdminInviteEmailHtml,
  buildAdminInviteEmailText,
} from '../../mail/templates/admin-invite.mail';
import { emailBrandingFromConfig } from '../../mail/utils/email-html-branding';
import { MailService } from '../../mail/services/mail.service';
import { INVITE_TTL_MS, RESET_TOKEN_TTL_MS } from '../constants/auth.constants';
import { BootstrapAdminDto } from '../dto/bootstrap-admin.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { InviteAdminDto } from '../dto/invite-admin.dto';
import { LoginDto } from '../dto/login.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { VerifyAdminInviteDto } from '../dto/verify-admin-invite.dto';
import type {
  AdminLoginResponse,
  ForgotPasswordResponse,
  GoogleIdTokenClaims,
} from '../types/auth.types';
import {
  comparePassword,
  generateInviteCode,
  generateResetToken,
  hashPassword,
  sha256Hex,
} from '../utils/auth-crypto.util';
import { adminLoginUserPayload } from '../utils/auth-payload.util';
import { AuthRepository } from './auth.repository';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly googleClient: OAuth2Client | null;

  constructor(
    private readonly repository: AuthRepository,
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

    const existingAdmin = await this.repository.findStaffAdminId();
    if (existingAdmin) {
      throw new ForbiddenException('Bootstrap already completed.');
    }

    const existingUser = await this.repository.findUserIdByEmail(
      dto.email.toLowerCase(),
    );
    if (existingUser) {
      throw new ConflictException('Email is already registered.');
    }

    const passwordHash = await hashPassword(dto.password);
    const user = await this.repository.createSuperAdmin({
      fullName: dto.fullName,
      email: dto.email.toLowerCase(),
      password: passwordHash,
      phone: dto.phone,
    });

    return {
      message: 'Admin account created successfully.',
      user: {
        ...user,
        permissions: deriveAdminPermissions(user.role),
      },
    };
  }

  async loginAdmin(dto: LoginDto): Promise<AdminLoginResponse> {
    const user = await this.repository.findUserByEmail(dto.email.toLowerCase());

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password) {
      throw new UnauthorizedException('Use Google sign-in for this account.');
    }

    const isPasswordValid = await comparePassword(dto.password, user.password);
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
      user: adminLoginUserPayload(user),
    };
  }

  async loginAdminGoogle(idToken: string): Promise<AdminLoginResponse> {
    const { email, sub } = await this.verifyGoogleIdToken(idToken);

    const user = await this.repository.findUserByEmail(email);

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
      await this.repository.bindGoogleSub(user.id, sub);
    }

    const accessToken = await this.signAdminAccessToken(user);

    return {
      message: 'Login successful',
      accessToken,
      user: adminLoginUserPayload(user),
    };
  }

  async inviteAdmin(inviterId: string, dto: InviteAdminDto) {
    if (!this.mail.isConfigured()) {
      throw new BadRequestException(this.mail.getMissingConfigMessage());
    }

    const inviter = await this.repository.findUserRoleById(inviterId);
    if (
      !inviter ||
      !deriveAdminPermissions(inviter.role).includes('admin.invite')
    ) {
      throw new ForbiddenException('Invalid inviter.');
    }

    const email = dto.email.toLowerCase();
    const fullName = dto.fullName.trim();

    const existing = await this.repository.findUserIdByEmail(email);
    if (existing) {
      throw new ConflictException(
        'This email is already registered. Use another email.',
      );
    }

    await this.repository.deletePendingInvitesByEmail(email);

    const code = generateInviteCode();
    const codeHash = sha256Hex(code);
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

    const invite = await this.repository.createAdminInvite({
      email,
      codeHash,
      fullName,
      invitedById: inviterId,
      expiresAt,
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
      await this.repository
        .deleteInviteById(invite.id)
        .catch(softFailToNull(this.logger, 'auth.invite.cleanup'));
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

    const invite = await this.repository.findValidInviteByEmail(email);

    if (!invite) {
      throw new UnauthorizedException('Invalid or expired invitation.');
    }

    const digest = sha256Hex(dto.code.trim());
    if (digest !== invite.codeHash) {
      throw new UnauthorizedException('Invalid verification code.');
    }

    const existingUser = await this.repository.findUserIdByEmail(email);
    if (existingUser) {
      throw new ConflictException('This email is already registered.');
    }

    const passwordHash = await hashPassword(dto.password);

    try {
      await this.repository.consumeInviteAndCreateAdmin({
        inviteId: invite.id,
        email,
        fullName: invite.fullName,
        passwordHash,
      });
    } catch (err) {
      if (err instanceof Error && err.message === 'INVITE_ALREADY_USED') {
        throw new ConflictException('Invitation was already used.');
      }
      throw err;
    }

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

  async forgotPassword(
    dto: ForgotPasswordDto,
  ): Promise<ForgotPasswordResponse> {
    const message =
      'If this email exists, a secure recovery link has been sent.';
    const user = await this.repository.findUserIdByEmail(
      dto.email.toLowerCase(),
    );

    let rawToken: string | null = null;

    if (user) {
      const generated = generateResetToken();
      rawToken = generated.rawToken;
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

      await this.repository.setPasswordResetToken(
        user.id,
        generated.tokenHash,
        expiresAt,
      );
    }

    const response: ForgotPasswordResponse = { message };

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
    const tokenHash = sha256Hex(dto.token);

    const user = await this.repository.findUserByValidResetToken(tokenHash);

    if (!user) {
      throw new UnauthorizedException('Invalid or expired recovery token');
    }

    const passwordHash = await hashPassword(dto.newPassword);

    await this.repository.updatePasswordAndClearReset(user.id, passwordHash);

    return { message: 'Password updated successfully' };
  }

  private async verifyGoogleIdToken(
    idToken: string,
  ): Promise<GoogleIdTokenClaims> {
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
