import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminJwtGuard } from '../contact/guards/admin-jwt.guard';
import { CurrentAdmin } from '../auth/decorators/current-admin.decorator';
import type { AdminJwtPayload } from '../auth/decorators/current-admin.decorator';
import { AdminBookingQueryDto } from './dto/admin-booking-query.dto';
import { CreateAdminBookingDto } from './dto/create-admin-booking.dto';
import { UpdateAdminBookingDto } from './dto/update-admin-booking.dto';
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
  @UseGuards(AdminJwtGuard)
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

  @Get('admin')
  @UseGuards(AdminJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List bookings (admin)' })
  findAllAdmin(@Query() query: AdminBookingQueryDto) {
    return this.bookingsService.findAllAdmin(query);
  }

  @Get('admin/:id')
  @UseGuards(AdminJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get one booking (admin)' })
  findOneAdmin(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.bookingsService.findOneAdmin(id);
  }

  @Patch('admin/:id')
  @UseGuards(AdminJwtGuard)
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
  removeAdmin(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.bookingsService.removeAdmin(id);
  }
}
