import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConsoleLogger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      prefix: 'nest-lab',
    })
  });

  const config = new DocumentBuilder()
    .setTitle('Hotel Booking System API')
    .setDescription('API for managing room and booking information with rate limiting (100 requests per minute)')
    .setVersion('1.0.0')
    .addTag('rooms')
    .addTag('bookings')
    .addBearerAuth(
          {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            name: 'JWT',
            description: 'Use: Authorization: Bearer <access_token>',
            in: 'header',
          },
          'access-token',
        )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  app.useGlobalPipes(new ValidationPipe());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
