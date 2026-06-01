import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../prisma/prisma.module';
import { AdminJwtGuard } from '../contact/guards/admin-jwt.guard';
import { FloorLayoutModule } from '../floor-layout/floor-layout.module';
import { StandaloneChairsController } from './standalone-chairs.controller';
import { StandaloneChairsService } from './standalone-chairs.service';

@Module({
  imports: [
    PrismaModule,
    FloorLayoutModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change-me-in-production',
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as never,
      },
    }),
  ],
  controllers: [StandaloneChairsController],
  providers: [StandaloneChairsService, AdminJwtGuard],
})
export class StandaloneChairsModule {}
