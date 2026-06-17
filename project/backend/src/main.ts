import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { PiiMaskingExceptionFilter } from './common/filters/pii-masking-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers using Helmet
  app.use(helmet({
    contentSecurityPolicy: false, // Turn off CSP for development & Swagger UI access
  }));

  // Enable CORS
  app.enableCors({
    origin: '*', // Adjust for production
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Global PII masking filter
  app.useGlobalFilters(new PiiMaskingExceptionFilter());

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Equinox Finance - Spend Management Suite')
    .setDescription('Enterprise Employee Expense Management Platform API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`API Documentation available at: http://localhost:${port}/api`);
}
bootstrap();
