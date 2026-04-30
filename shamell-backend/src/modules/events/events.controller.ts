import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminJwtGuard } from '../contact/guards/admin-jwt.guard';
import { CreateEventDto } from './dto/create-event.dto';
import { CreateEventTypeDto } from './dto/create-event-type.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { UpdateEventTypeDto } from './dto/update-event-type.dto';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  getPublicEvents() {
    return this.eventsService.getPublicEvents();
  }

  @Get('types')
  @HttpCode(HttpStatus.OK)
  getPublicEventTypes() {
    return this.eventsService.getPublicEventTypes();
  }

  @Get('admin')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  getAdminEvents() {
    return this.eventsService.getAdminEvents();
  }

  @Get('types/admin')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  getAdminEventTypes() {
    return this.eventsService.getAdminEventTypes();
  }

  @Get('admin/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  getAdminEventById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.eventsService.getAdminEventById(id);
  }

  @Post('admin')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AdminJwtGuard)
  createEvent(@Body() dto: CreateEventDto) {
    return this.eventsService.createEvent(dto);
  }

  @Post('types/admin')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AdminJwtGuard)
  createEventType(@Body() dto: CreateEventTypeDto) {
    return this.eventsService.createEventType(dto);
  }

  @Patch('admin/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  updateEvent(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateEventDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('Provide at least one field to update.');
    }
    return this.eventsService.updateEvent(id, dto);
  }

  @Delete('admin/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  deleteEvent(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.eventsService.deleteEvent(id);
  }

  @Patch('types/admin/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  updateEventType(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateEventTypeDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('Provide at least one field to update.');
    }
    return this.eventsService.updateEventType(id, dto);
  }

  @Delete('types/admin/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtGuard)
  deleteEventType(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.eventsService.deleteEventType(id);
  }
}
