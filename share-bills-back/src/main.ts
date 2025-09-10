import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import corsOptions from './config/corsOptions';
import morgan from 'morgan';
import { setupSwagger } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

  app.enableCors({
    origin: true,
    credentials: false,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
  });

  //Za swagger
  setupSwagger(app);

  await app.listen(process.env.PORT ?? 3000);

  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger documentation available at: ${await app.getUrl()}/api/docs`);
}
void bootstrap();
