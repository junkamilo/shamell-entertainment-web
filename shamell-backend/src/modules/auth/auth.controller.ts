import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { BootstrapAdminDto } from './dto/bootstrap-admin.dto';
import { InviteAdminDto } from './dto/invite-admin.dto';
import { VerifyAdminInviteDto } from './dto/verify-admin-invite.dto';
import { GoogleCredentialDto } from './dto/google-credential.dto';
import { AdminJwtGuard } from '../contact/guards/admin-jwt.guard';
import {
  CurrentAdmin,
  type AdminJwtPayload,
} from './decorators/current-admin.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('bootstrap/admin')
  @HttpCode(HttpStatus.CREATED)
  bootstrapAdmin(
    @Body() dto: BootstrapAdminDto,
    @Headers('x-bootstrap-secret') bootstrapSecret?: string,
  ) {
    return this.authService.bootstrapAdmin(dto, bootstrapSecret);
  }

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  loginAdmin(@Body() dto: LoginDto) {
    return this.authService.loginAdmin(dto);
  }

  @Post('admin/google-login')
  @HttpCode(HttpStatus.OK)
  loginAdminGoogle(@Body() dto: GoogleCredentialDto) {
    return this.authService.loginAdminGoogle(dto.credential);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.loginAdmin(dto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('admin/invite')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AdminJwtGuard)
  inviteAdmin(
    @CurrentAdmin() admin: AdminJwtPayload,
    @Body() dto: InviteAdminDto,
  ) {
    return this.authService.inviteAdmin(admin.id, dto);
  }

  @Post('admin/invite/verify')
  @HttpCode(HttpStatus.CREATED)
  verifyAdminInvite(@Body() dto: VerifyAdminInviteDto) {
    return this.authService.verifyAdminInvite(dto);
  }

  @Post('admin/invite/google')
  @HttpCode(HttpStatus.CREATED)
  completeAdminInviteGoogle(@Body() dto: GoogleCredentialDto) {
    return this.authService.completeAdminInviteGoogle(dto.credential);
  }
}
