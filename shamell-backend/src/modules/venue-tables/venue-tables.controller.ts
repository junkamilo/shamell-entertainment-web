import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminJwtGuard } from '../contact/guards/admin-jwt.guard';
import { BulkCreateVenueTableConfigDto } from './dto/bulk-create-venue-table-config.dto';
import { BulkDeleteVenueTableConfigDto } from './dto/bulk-delete-venue-table-config.dto';
import { PatchVenueTablesBulkPriceDto } from './dto/patch-venue-tables-bulk-price.dto';
import { CreateVenueTableConfigDto } from './dto/create-venue-table-config.dto';
import { UpdateVenueTableConfigDto } from './dto/update-venue-table-config.dto';
import { VenueTablesService } from './venue-tables.service';

@Controller('venue-tables')
export class VenueTablesController {
  constructor(private readonly venueTablesService: VenueTablesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  getPublicVenueTables() {
    return this.venueTablesService.getPublicVenueTables();
  }

  @Get('admin')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  getAdminVenueTables() {
    return this.venueTablesService.getAdminVenueTables();
  }

  @Get('admin/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  getAdminVenueTableById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.venueTablesService.getAdminVenueTableById(id);
  }

  @Post('admin')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AdminJwtGuard)
  createAdminVenueTable(@Body() dto: CreateVenueTableConfigDto) {
    return this.venueTablesService.createAdminVenueTable(dto);
  }

  @Post('admin/bulk')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AdminJwtGuard)
  bulkCreateAdminVenueTables(@Body() dto: BulkCreateVenueTableConfigDto) {
    return this.venueTablesService.bulkCreateAdminVenueTables(dto);
  }

  @Patch('admin/bulk-price')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  bulkUpdateAdminVenueTablesBundlePrice(@Body() dto: PatchVenueTablesBulkPriceDto) {
    return this.venueTablesService.bulkUpdateAdminVenueTablesBundlePrice(dto);
  }

  @Patch('admin/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  updateAdminVenueTable(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateVenueTableConfigDto,
  ) {
    return this.venueTablesService.updateAdminVenueTable(id, dto);
  }

  @Delete('admin/bulk')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  bulkDeleteAdminVenueTables(@Body() dto: BulkDeleteVenueTableConfigDto) {
    return this.venueTablesService.bulkDeleteAdminVenueTables(dto);
  }

  @Delete('admin/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  deleteAdminVenueTable(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.venueTablesService.deleteAdminVenueTable(id);
  }
}
