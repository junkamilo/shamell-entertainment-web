import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminJwtGuard } from '../contact/guards/admin-jwt.guard';
import { AdminPaymentsService } from './admin-payments.service';
import {
  AdminPaymentsBadgeQueryDto,
  AdminPaymentsQueryDto,
} from './dto/admin-payments-query.dto';

@ApiTags('Admin Payments')
@Controller('admin/payments')
export class AdminPaymentsController {
  constructor(private readonly adminPaymentsService: AdminPaymentsService) {}

  @Get()
  @UseGuards(AdminJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unified Stripe payment history (admin)' })
  listPayments(@Query() query: AdminPaymentsQueryDto) {
    return this.adminPaymentsService.listPayments(query);
  }

  @Get('badge')
  @UseGuards(AdminJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Count payment status updates since timestamp (admin badge)',
  })
  countBadge(@Query() query: AdminPaymentsBadgeQueryDto) {
    return this.adminPaymentsService.countBadgeSince(query.since);
  }
}
