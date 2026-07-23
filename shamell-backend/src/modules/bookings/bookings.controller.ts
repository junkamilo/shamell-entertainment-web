import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminJwtGuard } from '../../common/auth/admin-jwt.guard';
import { CurrentAdmin } from '../auth/decorators/current-admin.decorator';
import type { AdminJwtPayload } from '../auth/decorators/current-admin.decorator';
import { AdminBookingQueryDto } from './dto/admin-booking-query.dto';
import { AdminCalendarQueryDto } from './dto/admin-calendar-query.dto';
import { CreateBookingQuoteDto } from './dto/create-booking-quote.dto';
import { CreateAdminBookingDto } from './dto/create-admin-booking.dto';
import { CreatePrivateClassBookingDto } from './dto/create-private-class-booking.dto';
import { SendBookingBalanceLinkDto } from './dto/send-booking-balance-link.dto';
import { UpdateAdminBookingDto } from './dto/update-admin-booking.dto';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { BookingsService } from './bookings.service';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('public/occupied')
  @ApiOperation({ summary: 'Occupied time ranges for a booking date (public)' })
  getOccupiedPublic(@Query('date') dateISO: string) {
    return this.bookingsService.getPublicOccupiedByDate(dateISO);
  }

  @Post('admin')
  @UseGuards(AdminJwtGuard, ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create booking on behalf of a guest or registered client (admin)',
  })
  createAdmin(
    @CurrentAdmin() admin: AdminJwtPayload,
    @Body() dto: CreateAdminBookingDto,
  ) {
    return this.bookingsService.createAdminBooking(admin.id, dto);
  }

  @Post('admin/private-class/cash')
  @UseGuards(AdminJwtGuard, ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create private class booking paid in cash (admin)' })
  createPrivateClassCash(
    @CurrentAdmin() admin: AdminJwtPayload,
    @Body() dto: CreatePrivateClassBookingDto,
  ) {
    return this.bookingsService.createPrivateClassCash(admin.id, dto);
  }

  @Post('admin/private-class/checkout-session')
  @UseGuards(AdminJwtGuard, ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create private class booking and send Stripe payment link (admin)',
  })
  createPrivateClassCheckout(
    @CurrentAdmin() admin: AdminJwtPayload,
    @Body() dto: CreatePrivateClassBookingDto,
  ) {
    return this.bookingsService.createPrivateClassCheckoutSession(admin.id, dto);
  }

  @Get('admin')
  @UseGuards(AdminJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List bookings (admin)' })
  findAllAdmin(@Query() query: AdminBookingQueryDto) {
    return this.bookingsService.findAllAdmin(query);
  }

  @Get('admin/calendar')
  @UseGuards(AdminJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bookings in date range for calendar view (admin)' })
  findCalendarAdmin(@Query() query: AdminCalendarQueryDto) {
    return this.bookingsService.findCalendarAdmin(query);
  }

  @Get('admin/:id')
  @UseGuards(AdminJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get one booking (admin)' })
  findOneAdmin(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.bookingsService.findOneAdmin(id);
  }

  @Patch('admin/:id')
  @UseGuards(AdminJwtGuard, ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update booking schedule/catalog/status (admin)' })
  updateAdmin(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAdminBookingDto,
  ) {
    return this.bookingsService.updateAdmin(id, dto);
  }

  @Delete('admin/:id')
  @UseGuards(AdminJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete booking (admin)' })
  removeAdmin(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('purgeContact') purgeContact?: string,
  ) {
    return this.bookingsService.removeAdmin(id, {
      purgeContact: purgeContact === 'true' || purgeContact === '1',
    });
  }

  @Post('admin/:id/quote')
  @UseGuards(AdminJwtGuard)
  @ApiBearerAuth()
  createQuote(
    @CurrentAdmin() admin: AdminJwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateBookingQuoteDto,
  ) {
    return this.bookingsService.createBookingQuote(admin.id, id, dto);
  }

  @Post('admin/:id/send-balance-link')
  @UseGuards(AdminJwtGuard)
  @ApiBearerAuth()
  sendBalanceLink(
    @CurrentAdmin() admin: AdminJwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SendBookingBalanceLinkDto,
  ) {
    return this.bookingsService.sendBookingBalanceLink(admin.id, id, dto);
  }

  @Get('public/quote/pay')
  quotePayRedirect(@Query('token') token: string, @Res() res: Response) {
    if (!token?.trim()) {
      throw new BadRequestException('token is required.');
    }
    const url = this.bookingsService.resolveQuotePayUrl(token.trim());
    return res.redirect(url);
  }

  @Get('public/quote/checkout')
  @ApiOperation({
    summary: 'Embedded Stripe client secret for booking quote pay link',
  })
  quoteCheckout(@Query('token') token: string) {
    if (!token?.trim()) {
      throw new BadRequestException('token is required.');
    }
    return this.bookingsService
      .resolveQuoteCheckoutClientSecret(token.trim())
      .then((clientSecret) => ({ clientSecret }));
  }

  @Post('public/quote/reconcile')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @ApiOperation({
    summary: 'Reconcile booking quote payment from Stripe (public)',
  })
  quoteReconcile(@Query('session_id') sessionId: string) {
    if (!sessionId?.trim()) {
      throw new BadRequestException('session_id is required.');
    }
    return this.bookingsService.getQuotePaymentSessionStatus(sessionId.trim());
  }

  @Get('public/quote/session-status')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({
    summary: 'Booking quote payment session status (public return page)',
  })
  quoteSessionStatus(@Query('session_id') sessionId: string) {
    if (!sessionId?.trim()) {
      throw new BadRequestException('session_id is required.');
    }
    return this.bookingsService.getQuotePaymentSessionStatus(sessionId.trim());
  }

  @Post('public/webhook')
  @HttpCode(HttpStatus.GONE)
  handleBookingPaymentsWebhookDeprecated() {
    return {
      deprecated: true,
      message:
        'Use POST /api/v1/stripe/webhook instead. This endpoint is no longer active.',
    };
  }
}
