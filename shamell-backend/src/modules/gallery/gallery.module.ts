import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { GalleryController } from './controllers/gallery.controller';
import { GalleryMediaService } from './services/gallery-media.service';
import { GalleryRepository } from './services/gallery.repository';
import { GalleryService } from './services/gallery.service';

@Module({
  imports: [PrismaModule],
  controllers: [GalleryController],
  providers: [GalleryRepository, GalleryMediaService, GalleryService],
  exports: [GalleryService],
})
export class GalleryModule {}
