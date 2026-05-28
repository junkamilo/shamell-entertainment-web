// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.enableShutdownHooks();

  // Security
  app.use(helmet());

  // CORS: un origen o varios separados por coma (p. ej. dominio www + Vercel).
  const frontendOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const corsOrigin =
    frontendOrigins.length === 1 ? frontendOrigins[0] : frontendOrigins;

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  // Validación global automática de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina props que no estén en el DTO
      forbidNonWhitelisted: true, // lanza error si hay props extras
      transform: true, // convierte tipos automáticamente
    }),
  );

  // Prefijo global para todas las rutas: /api/v1/...
  app.setGlobalPrefix('api/v1');

  // Swagger - documentación automática
  const config = new DocumentBuilder()
    .setTitle("SHAMELL's Golden Stage API")
    .setDescription('API for luxury Oriental dance performances')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const basePort = Number(process.env.PORT ?? 3001);
  const maxAttempts = 10;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const port = basePort + attempt;

    try {
      await app.listen(port);
      console.log(`🚀 Backend running on http://localhost:${port}`);
      console.log(`📚 Swagger docs on http://localhost:${port}/docs`);
      return;
    } catch (error: unknown) {
      const isAddressInUse =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: string }).code === 'EADDRINUSE';

      if (!isAddressInUse || attempt === maxAttempts - 1) {
        throw error;
      }
    }
  }
}
void bootstrap();
