import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { GalleryModule } from '../gallery/gallery.module';
import { EventsController } from './controllers/events.controller';
import { EventsRepository } from './services/events.repository';
import { EventsService } from './services/events.service';

@Module({
  imports: [GalleryModule, PrismaModule],
  controllers: [EventsController],
  providers: [EventsRepository, EventsService],
  exports: [EventsService],
})
export class EventsModule {}
