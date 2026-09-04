import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: {
    project: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    membership: { findUnique: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      project: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      membership: { findUnique: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(ProjectsService);
  });

  describe('create', () => {
    it('creates a project with the three default columns', async () => {
      prisma.project.create.mockResolvedValue({
        id: 'proj1',
        name: 'Website',
        columns: [
          { id: 'c1', name: 'Backlog', order: 0 },
          { id: 'c2', name: 'In Progress', order: 1 },
          { id: 'c3', name: 'Done', order: 2 },
        ],
      });

      await service.create('org1', { name: 'Website' });

      expect(prisma.project.create).toHaveBeenCalledWith({
        data: {
          name: 'Website',
          description: undefined,
          organizationId: 'org1',
          columns: {
            create: [
              { name: 'Backlog', order: 0 },
              { name: 'In Progress', order: 1 },
              { name: 'Done', order: 2 },
            ],
          },
        },
        include: { columns: { orderBy: { order: 'asc' } } },
      });
    });
  });

  describe('findAllForOrg', () => {
    it('scopes the query to the given organization', async () => {
      prisma.project.findMany.mockResolvedValue([]);

      await service.findAllForOrg('org1');

      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org1' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when the project does not exist', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('verifies the project exists before updating', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 'proj1' });
      prisma.project.update.mockResolvedValue({ id: 'proj1', name: 'Renamed' });

      const result = await service.update('proj1', { name: 'Renamed' });

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: 'proj1' },
        data: { name: 'Renamed' },
      });
      expect(result.name).toBe('Renamed');
    });

    it('throws NotFoundException when the project does not exist', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      await expect(
        service.update('missing', { name: 'Renamed' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.project.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes an existing project', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 'proj1' });
      prisma.project.delete.mockResolvedValue({ id: 'proj1' });

      const result = await service.remove('proj1');

      expect(prisma.project.delete).toHaveBeenCalledWith({
        where: { id: 'proj1' },
      });
      expect(result).toEqual({ id: 'proj1', deleted: true });
    });
  });

  describe('assertProjectMembership', () => {
    it('throws NotFoundException when the project does not exist', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      await expect(
        service.assertProjectMembership('missing', 'user1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("throws ForbiddenException when the user isn't a member of the project's org", async () => {
      prisma.project.findUnique.mockResolvedValue({
        id: 'proj1',
        organizationId: 'org1',
      });
      prisma.membership.findUnique.mockResolvedValue(null);

      await expect(
        service.assertProjectMembership('proj1', 'user1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('returns the project and membership when the user belongs to the org', async () => {
      const project = { id: 'proj1', organizationId: 'org1' };
      const membership = { userId: 'user1', organizationId: 'org1' };
      prisma.project.findUnique.mockResolvedValue(project);
      prisma.membership.findUnique.mockResolvedValue(membership);

      const result = await service.assertProjectMembership('proj1', 'user1');

      expect(result).toEqual({ project, membership });
    });
  });
});
