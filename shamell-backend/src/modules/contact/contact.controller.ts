// src/modules/contact/contact.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ContactService } from './contact.service';
import { AdminContactQueryDto } from './dto/admin-contact-query.dto';
import { AdminPeticionesBadgeQueryDto } from './dto/admin-peticiones-badge-query.dto';
import { AdminPeticionesQueryDto } from './dto/admin-peticiones-query.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactStatusDto } from './dto/update-contact-status.dto';
import { AdminJwtGuard } from './guards/admin-jwt.guard';

@ApiTags('Contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a contact request' })
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  create(@Body() dto: CreateContactDto) {
    return this.contactService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all contact requests (admin)' })
  @UseGuards(AdminJwtGuard)
  findAll(@Query() query: AdminContactQueryDto) {
    return this.contactService.findAll(query);
  }

  @Get('peticiones')
  @ApiOperation({ summary: 'Get unified peticiones feed (admin)' })
  @UseGuards(AdminJwtGuard)
  findAllPeticiones(@Query() query: AdminPeticionesQueryDto) {
    return this.contactService.findAllPeticiones(query);
  }

  @Get('peticiones/badge')
  @ApiOperation({
    summary: 'Count unified inbox items since timestamp (admin badge)',
  })
  @UseGuards(AdminJwtGuard)
  countPeticionesBadge(@Query() query: AdminPeticionesBadgeQueryDto) {
    return this.contactService.countPeticionesBadge(query);
  }

  @Get(':id')
  @UseGuards(AdminJwtGuard)
  findOne(@Param('id') id: string) {
    return this.contactService.findOne(id);
  }

  @Patch(':id/read')
  @UseGuards(AdminJwtGuard)
  markAsRead(@Param('id') id: string) {
    return this.contactService.markAsRead(id);
  }

  @Patch(':id/status')
  @UseGuards(AdminJwtGuard)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateContactStatusDto) {
    return this.contactService.updateStatus(id, dto.status);
  }

  @Delete(':id')
  @UseGuards(AdminJwtGuard)
  remove(@Param('id') id: string) {
    return this.contactService.remove(id);
  }
}
