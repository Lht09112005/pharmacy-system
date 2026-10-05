import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { configureApplication } from '../src/common/configure-application.js';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

export async function appForDatabaseTests() {
  const moduleFixture = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app: INestApplication = moduleFixture.createNestApplication();
  configureApplication(app);
  await app.init();
  return { app, prisma: app.get(PrismaService) };
}
