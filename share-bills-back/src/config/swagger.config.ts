import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Share Bills API')
    .setDescription('API za deljenje troškova između korisnika')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'Endpoints za autentifikaciju korisnika')
    .addTag('Users', 'Endpoints za upravljanje korisnicima')
    .addTag('Groups', 'Endpoints za upravljanje grupama')
    .addTag('Expenses', 'Endpoints za upravljanje troškovima')
    .addTag('Group Members', 'Endpoints za upravljanje članovima grupa')
    .addTag('Expense Participants', 'Endpoints za upravljanje učesnicima troškova')
    .addTag('Group Members Balance', 'Endpoints za upravljanje balansima članova grupa')
    .addTag('Storage', 'Endpoints za upravljanje fajlovima')
    .addServer('http://localhost:3000', 'Development server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showRequestHeaders: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
    },
    customSiteTitle: 'Share Bills API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #3b82f6; }
      .swagger-ui .scheme-container { background: #1f2937; padding: 10px; border-radius: 4px; }
    `,
  });
}

