import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import corsOptions from './config/corsOptions';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useLogger(app.get(Logger))
  await app.listen(process.env.PORT ?? 3000);
  app.enableCors({
    corsOptions
  });
  app.setGlobalPrefix('api');
  console.log(`Application is running on: ${await app.getUrl()}`);

}
void bootstrap();
