import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './modules/app/app.module';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Setup Swagger configuration
  setupSwagger(app);
  app.useStaticAssets(join(process.cwd(), 'generated-sites'), {
    prefix: '/generated-sites/',
  });


  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
