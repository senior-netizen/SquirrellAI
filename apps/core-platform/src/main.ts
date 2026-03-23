import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const logger = new Logger('Bootstrap');

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',').map((origin: string) => origin.trim()) ?? true,
    credentials: true,
  });
  app.setGlobalPrefix('v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT ?? '3000');
  await app.listen(port);
  logger.log(`core-platform listening on port ${port}`);
}

void bootstrap();
