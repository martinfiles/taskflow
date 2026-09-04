import { PrismaClient, Role, TaskPriority } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash('Password123!', 10);

  const owner = await prisma.user.upsert({
    where: { email: 'owner@taskflow.dev' },
    update: {},
    create: { email: 'owner@taskflow.dev', name: 'Ada Owner', passwordHash },
  });

  const member = await prisma.user.upsert({
    where: { email: 'member@taskflow.dev' },
    update: {},
    create: { email: 'member@taskflow.dev', name: 'Grace Member', passwordHash },
  });

  const org = await prisma.organization.upsert({
    where: { slug: 'acme-inc' },
    update: {},
    create: { name: 'Acme Inc.', slug: 'acme-inc' },
  });

  await prisma.membership.createMany({
    data: [
      { userId: owner.id, organizationId: org.id, role: Role.OWNER },
      { userId: member.id, organizationId: org.id, role: Role.MEMBER },
    ],
    skipDuplicates: true,
  });

  const project = await prisma.project.create({
    data: {
      name: 'Website Relaunch',
      description: 'Redesign and rebuild the marketing site.',
      organizationId: org.id,
      columns: {
        create: [
          { name: 'Backlog', order: 0 },
          { name: 'In Progress', order: 1 },
          { name: 'Done', order: 2 },
        ],
      },
    },
    include: { columns: true },
  });

  const backlog = project.columns.find((c) => c.name === 'Backlog')!;

  await prisma.task.create({
    data: {
      title: 'Set up design system tokens',
      description: 'Define color, spacing and typography tokens in Tailwind config.',
      priority: TaskPriority.HIGH,
      position: 0,
      projectId: project.id,
      columnId: backlog.id,
      createdById: owner.id,
      assignees: { create: [{ userId: member.id }] },
    },
  });

  console.log('Seed complete:', { org: org.slug, users: [owner.email, member.email] });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
