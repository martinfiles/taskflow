import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { randomUUID } from 'crypto';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Organization invitation flow', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const ownerEmail = `e2e-owner-${randomUUID()}@taskflow.dev`;
  const inviteeEmail = `e2e-invitee-${randomUUID()}@taskflow.dev`;
  const password = 'Password123!';
  const orgSlug = `e2e-invite-org-${randomUUID().slice(0, 8)}`;

  let ownerToken: string;
  let inviteeToken: string;
  let organizationId: string;
  let invitationToken: string;

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
      where: { email: { in: [ownerEmail, inviteeEmail] } },
    });
    await app.close();
  });

  it('sets up the owner, an organization, and a second user to invite', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: ownerEmail, password, name: 'Owner' })
      .expect(201);

    const ownerLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: ownerEmail, password })
      .expect(200);
    ownerToken = ownerLogin.body.accessToken;

    const orgRes = await request(app.getHttpServer())
      .post('/api/organizations')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Invite Flow Org', slug: orgSlug })
      .expect(201);
    organizationId = orgRes.body.id;

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: inviteeEmail, password, name: 'Invitee' })
      .expect(201);

    const inviteeLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: inviteeEmail, password })
      .expect(200);
    inviteeToken = inviteeLogin.body.accessToken;
  });

  it('lets the OWNER invite a member by email', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/organizations/${organizationId}/invitations`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: inviteeEmail, role: 'MEMBER' })
      .expect(201);

    expect(res.body.token).toBeDefined();
    expect(res.body.email).toBe(inviteeEmail);
    invitationToken = res.body.token;
  });

  it('rejects a non-owner inviting a member', async () => {
    await request(app.getHttpServer())
      .post(`/api/organizations/${organizationId}/invitations`)
      .set('Authorization', `Bearer ${inviteeToken}`)
      .send({ email: 'someone-else@taskflow.dev', role: 'MEMBER' })
      .expect(403);
  });

  it('lets the invitee accept the invitation and become a member', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/organizations/invitations/${invitationToken}/accept`)
      .set('Authorization', `Bearer ${inviteeToken}`)
      .expect(201);

    expect(res.body.organizationId).toBe(organizationId);
    expect(res.body.role).toBe('MEMBER');
  });

  it('rejects accepting the same invitation twice', async () => {
    await request(app.getHttpServer())
      .post(`/api/organizations/invitations/${invitationToken}/accept`)
      .set('Authorization', `Bearer ${inviteeToken}`)
      .expect(404);
  });

  it('lists the invitee as a member of the organization', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/organizations/${organizationId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    const emails = res.body.map((m: { email: string }) => m.email);
    expect(emails).toContain(inviteeEmail);
  });
});
