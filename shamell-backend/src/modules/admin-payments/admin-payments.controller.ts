import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminJwtGuard } from '../../common/auth/admin-jwt.guard';
import {
  ADMIN_PAYMENT_DETAIL_FLOWS,
  type AdminPaymentDetailFlow,
} from './admin-payments-detail.types';
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

  @Get(':flow/:id')
  @UseGuards(AdminJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Payment detail for admin summary modal' })
  getPaymentDetail(@Param('flow') flow: string, @Param('id') id: string) {
    if (!ADMIN_PAYMENT_DETAIL_FLOWS.includes(flow as AdminPaymentDetailFlow)) {
      throw new BadRequestException('Invalid payment flow.');
    }
    if (!id?.trim()) {
      throw new BadRequestException('Payment id is required.');
    }
    return this.adminPaymentsService.getPaymentDetail(
      flow as AdminPaymentDetailFlow,
      id.trim(),
    );
  }
}
