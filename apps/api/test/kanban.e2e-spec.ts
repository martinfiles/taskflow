import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { randomUUID } from 'crypto';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Kanban board flow (create, move, assign)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const memberEmail = `e2e-kb-member-${randomUUID()}@taskflow.dev`;
  const outsiderEmail = `e2e-kb-outsider-${randomUUID()}@taskflow.dev`;
  const password = 'Password123!';
  const orgSlug = `e2e-kanban-org-${randomUUID().slice(0, 8)}`;

  let memberId: string;
  let memberToken: string;
  let outsiderToken: string;
  let organizationId: string;
  let projectId: string;
  let backlogColumnId: string;
  let inProgressColumnId: string;
  let taskId: string;

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
    await prisma.user.deleteMany({
      where: { email: { in: [memberEmail, outsiderEmail] } },
    });
    await app.close();
  });

  it('registers the org member and an unrelated outsider', async () => {
    const memberRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: memberEmail, password, name: 'Board Member' })
      .expect(201);
    memberId = memberRes.body.user.id;
    memberToken = memberRes.body.accessToken;

    const outsiderRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: outsiderEmail, password, name: 'Outsider' })
      .expect(201);
    outsiderToken = outsiderRes.body.accessToken;
  });

  it('creates an organization and a project with default columns', async () => {
    const orgRes = await request(app.getHttpServer())
      .post('/api/organizations')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Kanban Org', slug: orgSlug })
      .expect(201);
    organizationId = orgRes.body.id;

    const projectRes = await request(app.getHttpServer())
      .post(`/api/organizations/${organizationId}/projects`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Kanban Project' })
      .expect(201);
    projectId = projectRes.body.id;
    backlogColumnId = projectRes.body.columns.find(
      (c: { name: string }) => c.name === 'Backlog',
    ).id;
    inProgressColumnId = projectRes.body.columns.find(
      (c: { name: string }) => c.name === 'In Progress',
    ).id;
  });

  it('creates a task in Backlog', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ columnId: backlogColumnId, title: 'Design the schema' })
      .expect(201);

    taskId = res.body.id;
    expect(res.body.columnId).toBe(backlogColumnId);
    expect(res.body.position).toBe(0);
  });

  it('moves the task to In Progress (drag-and-drop reorder)', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/tasks/${taskId}/move`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ columnId: inProgressColumnId, position: 0 })
      .expect(200);

    expect(res.body.columnId).toBe(inProgressColumnId);
    expect(res.body.position).toBe(0);
  });

  it('assigns the task to the member', async () => {
    await request(app.getHttpServer())
      .post(`/api/tasks/${taskId}/assignees`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ userId: memberId })
      .expect(201);
  });

  it('reflects the final column and assignee when reading the project', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);

    const inProgress = res.body.columns.find(
      (c: { id: string }) => c.id === inProgressColumnId,
    );
    const task = inProgress.tasks.find((t: { id: string }) => t.id === taskId);
    expect(task).toBeDefined();
    expect(
      task.assignees.map((a: { user: { id: string } }) => a.user.id),
    ).toContain(memberId);
  });

  it("rejects an outsider (non-member) from reading the org's projects", async () => {
    await request(app.getHttpServer())
      .get(`/api/organizations/${organizationId}/projects`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .expect(403);
  });

  it('rejects an outsider (non-member) from reading a single project by id', async () => {
    await request(app.getHttpServer())
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .expect(403);
  });

  it('rejects requests with no token at all', async () => {
    await request(app.getHttpServer())
      .get(`/api/projects/${projectId}`)
      .expect(401);
  });
});
