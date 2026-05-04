import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import {NestExpressApplication} from '@nestjs/platform-express';
import {
  DocumentBuilder,
  SwaggerDocumentOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import {ValidationPipe} from '@nestjs/common';
import * as process from 'node:process';
import {join} from 'path';
import {SanitizeStringsPipe} from '@shared/sanitizers/sanitize-strings.pipe';
import cookieParser from 'cookie-parser';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(cookieParser());

  // global BE prefix
  app.setGlobalPrefix('api');

  // global validation
  app.useGlobalPipes(
    new SanitizeStringsPipe(),
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );

  // Folder for uploading swarm pictures
  app.useStaticAssets(join(process.cwd(), 'uploads'), {prefix: '/uploads/'});

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  });

  if (process.env.NODE_ENV === 'development') {
    const config = new DocumentBuilder()
      .setTitle('Software for Bee Swarm Analysis BE')
      .setDescription('API application endpoints')
      .setVersion('1.0')
      .build();

    // Overwriting controller class name key into a method key
    const options: SwaggerDocumentOptions = {
      operationIdFactory: (_controllerKey: string, methodKey: string) =>
        methodKey
    };

    const document = SwaggerModule.createDocument(app, config, options);
    SwaggerModule.setup('api/doc', app, document, {
      swaggerOptions: {
        withCredentials: true,
      },
    });
  }

  app.set('query parser', 'extended');
  await app.listen(process.env.BACKEND_PORT!);
}

bootstrap().catch(() => {
  process.exit(1);
});