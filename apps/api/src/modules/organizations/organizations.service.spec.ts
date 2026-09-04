import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OrganizationsService } from './organizations.service';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let prisma: {
    organization: { findUnique: jest.Mock; create: jest.Mock };
    membership: { count: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      organization: { findUnique: jest.fn(), create: jest.fn() },
      membership: { count: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(OrganizationsService);
  });

  describe('create', () => {
    it('throws ConflictException when the slug is already taken', async () => {
      prisma.organization.findUnique.mockResolvedValue({
        id: 'org1',
        slug: 'acme',
      });

      await expect(
        service.create('user1', { name: 'Acme', slug: 'acme' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.organization.create).not.toHaveBeenCalled();
    });

    it('creates the organization with the creator as OWNER', async () => {
      prisma.organization.findUnique.mockResolvedValue(null);
      prisma.organization.create.mockResolvedValue({
        id: 'org1',
        name: 'Acme',
        slug: 'acme',
      });

      await service.create('user1', { name: 'Acme', slug: 'acme' });

      expect(prisma.organization.create).toHaveBeenCalledWith({
        data: {
          name: 'Acme',
          slug: 'acme',
          memberships: { create: { userId: 'user1', role: Role.OWNER } },
        },
      });
    });
  });
});
