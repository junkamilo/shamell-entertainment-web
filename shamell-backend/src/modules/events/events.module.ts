import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../prisma/prisma.module';
import { AdminJwtGuard } from '../contact/guards/admin-jwt.guard';
import { GalleryModule } from '../gallery/gallery.module';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [
    GalleryModule,
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change-me-in-production',
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as never,
      },
    }),
  ],
  controllers: [EventsController],
  providers: [EventsService, AdminJwtGuard],
})
export class EventsModule {}
