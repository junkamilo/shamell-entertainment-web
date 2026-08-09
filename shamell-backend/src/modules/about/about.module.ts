import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AboutController } from './controllers/about.controller';
import { AboutMediaService } from './services/about-media.service';
import { AboutRepository } from './services/about.repository';
import { AboutService } from './services/about.service';

@Module({
  imports: [PrismaModule],
  controllers: [AboutController],
  providers: [AboutRepository, AboutMediaService, AboutService],
  exports: [AboutService],
})
export class AboutModule {}
