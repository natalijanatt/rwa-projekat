import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import corsOptions from './config/corsOptions';
import morgan from 'morgan';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

  await app.listen(process.env.PORT ?? 3000);
  app.enableCors({
    corsOptions
  });
  app.setGlobalPrefix('api');
  console.log(`Application is running on: ${await app.getUrl()}`);

}
void bootstrap();
