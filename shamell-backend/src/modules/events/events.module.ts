import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { GalleryModule } from '../gallery/gallery.module';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [GalleryModule, PrismaModule],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
