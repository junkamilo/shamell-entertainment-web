import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { StartEmailVerificationDto } from '../dto/start-email-verification.dto';
import { VerifyEmailVerificationDto } from '../dto/verify-email-verification.dto';
import { ResendEmailVerificationDto } from '../dto/resend-email-verification.dto';
import { EmailVerificationService } from '../services/email-verification.service';

@ApiTags('Email verification')
@Controller('email-verification')
export class EmailVerificationController {
  constructor(private readonly emailVerification: EmailVerificationService) {}

  @Post('start')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Send a 6-digit email verification code' })
  start(@Body() dto: StartEmailVerificationDto) {
    return this.emailVerification.start(dto);
  }

  @Post('verify')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Verify the email code and receive a one-time token',
  })
  verify(@Body() dto: VerifyEmailVerificationDto) {
    return this.emailVerification.verify(dto);
  }

  @Post('resend')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Resend the email verification code' })
  resend(@Body() dto: ResendEmailVerificationDto) {
    return this.emailVerification.resend(dto.challengeId);
  }
}
