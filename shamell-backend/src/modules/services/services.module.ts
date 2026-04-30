import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../prisma/prisma.module';
import { AdminJwtGuard } from '../contact/guards/admin-jwt.guard';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change-me-in-production',
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as never,
      },
    }),
  ],
  controllers: [ServicesController],
  providers: [ServicesService, AdminJwtGuard],
})
export class ServicesModule {}
