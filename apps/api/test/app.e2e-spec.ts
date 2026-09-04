import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { randomUUID } from 'crypto';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('TaskFlow end-to-end flow', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const email = `e2e-${randomUUID()}@taskflow.dev`;
  const password = 'Password123!';
  const orgSlug = `e2e-org-${randomUUID().slice(0, 8)}`;

  let accessToken: string;
  let organizationId: string;
  let projectId: string;
  let backlogColumnId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    if (organizationId) {
      await prisma.organization.deleteMany({ where: { id: organizationId } });
    }
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  it('registers a new user', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password, name: 'E2E User' })
      .expect(201);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe(email);
  });

  it('logs in with the created credentials', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    accessToken = res.body.accessToken;
    expect(accessToken).toBeDefined();
  });

  it('creates an organization (creator becomes OWNER)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/organizations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'E2E Org', slug: orgSlug })
      .expect(201);

    organizationId = res.body.id;
    expect(res.body.slug).toBe(orgSlug);
  });

  it('creates a project with default columns', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/organizations/${organizationId}/projects`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'E2E Project' })
      .expect(201);

    projectId = res.body.id;
    expect(res.body.columns).toHaveLength(3);
    backlogColumnId = res.body.columns.find(
      (c: { name: string }) => c.name === 'Backlog',
    ).id;
  });

  it('creates a task in the Backlog column', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ columnId: backlogColumnId, title: 'E2E Task', priority: 'HIGH' })
      .expect(201);

    expect(res.body.title).toBe('E2E Task');
    expect(res.body.columnId).toBe(backlogColumnId);
  });

  it('rejects unauthenticated access', async () => {
    await request(app.getHttpServer()).get('/api/organizations').expect(401);
  });
});
