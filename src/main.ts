import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import getPort from 'get-port';
import { AppModule } from './modules/app/app.module';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Setup Swagger configuration
  setupSwagger(app);
  app.useStaticAssets(join(process.cwd(), 'generated-sites'), {
    prefix: '/generated-sites/',
  });

  // Find an available port
  const preferredPort = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  const port = await getPort({ port: preferredPort });

  if (port !== preferredPort) {
    console.log(`⚠️  Port ${preferredPort} is in use, using port ${port} instead`);
  }

  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
