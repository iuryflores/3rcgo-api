import 'reflect-metadata';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { HttpErrorFilter } from './http-error.filter.js';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export async function createApp() {
  for (const name of ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM', 'LGPD_TO', 'ALLOWED_ORIGINS']) {
    if (!process.env[name]?.trim()) throw new Error(`Configure ${name} antes de iniciar a API.`);
  }
  const origins = new Set(process.env.ALLOWED_ORIGINS!.split(',').map(value => value.trim()));
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  app.disable('x-powered-by');
  app.use((req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Vary', 'Origin');
    if (req.method === 'GET' && (req.path === '/' || req.path === '/health')) return next();
    if (req.method === 'GET' && (req.path === '/docs' || req.path.startsWith('/docs/') || req.path === '/docs-json')) return next();
    if (!req.headers.origin || !origins.has(req.headers.origin)) {
      res.status(403).json({ msg: 'Origem não autorizada.' });
      return;
    }
    next();
  });
  app.enableCors({ origin: [...origins], methods: ['POST', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] });
  app.useBodyParser('json', { limit: 32768 });
  app.useGlobalPipes(new ValidationPipe({
    transform: true, whitelist: true,
    exceptionFactory: () => new BadRequestException('Verifique os campos obrigatórios, o e-mail e o aceite.'),
  }));
  app.useGlobalFilters(new HttpErrorFilter());
  const swaggerConfig = new DocumentBuilder()
    .setTitle('3rcgo API')
    .setDescription('API de solicitações LGPD do 3º Cartório de Goiânia. O envio exige Origin permitido em ALLOWED_ORIGINS e está limitado a 5 tentativas por IP a cada 15 minutos. O health check confirma o processo, sem verificar a entrega SMTP.')
    .setVersion('1.0.0')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig), {
    jsonDocumentUrl: 'docs-json', raw: ['json'],
    customSiteTitle: '3rcgo — Documentação da API',
    swaggerOptions: { validatorUrl: null },
  });
  app.enableShutdownHooks();
  return app;
}
