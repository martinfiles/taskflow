import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { InviteMemberDto } from './dto/invite-member.dto';

const INVITATION_TTL_DAYS = 7;

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrganizationDto) {
    const existingSlug = await this.prisma.organization.findUnique({
      where: { slug: dto.slug },
    });
    if (existingSlug) {
      throw new ConflictException('That organization slug is already taken');
    }

    return this.prisma.organization.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        memberships: {
          create: { userId, role: Role.OWNER },
        },
      },
    });
  }

  async findMyOrganizations(userId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      include: { organization: true },
      orderBy: { joinedAt: 'asc' },
    });

    return memberships.map((m) => ({ ...m.organization, myRole: m.role }));
  }

  async listMembers(organizationId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { organizationId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return memberships.map((m) => ({
      ...m.user,
      role: m.role,
      joinedAt: m.joinedAt,
    }));
  }

  async invite(organizationId: string, dto: InviteMemberDto) {
    const token = randomBytes(24).toString('hex');
    const expiresAt = new Date(
      Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000,
    );

    return this.prisma.invitation.create({
      data: {
        email: dto.email,
        role: dto.role,
        token,
        expiresAt,
        organizationId,
      },
    });
  }

  async acceptInvitation(userId: string, token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
    });
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }
    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('This invitation has expired');
    }

    const existing = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: invitation.organizationId,
        },
      },
    });
    if (existing) {
      throw new ConflictException(
        'You are already a member of this organization',
      );
    }

    const [membership] = await this.prisma.$transaction([
      this.prisma.membership.create({
        data: {
          userId,
          organizationId: invitation.organizationId,
          role: invitation.role,
        },
      }),
      this.prisma.invitation.delete({ where: { id: invitation.id } }),
    ]);

    return membership;
  }

  async updateMemberRole(
    organizationId: string,
    targetUserId: string,
    role: Role,
    actingUserId: string,
  ) {
    if (targetUserId === actingUserId && role !== Role.OWNER) {
      const ownerCount = await this.prisma.membership.count({
        where: { organizationId, role: Role.OWNER },
      });
      if (ownerCount <= 1) {
        throw new ForbiddenException(
          'An organization must keep at least one OWNER',
        );
      }
    }

    return this.prisma.membership.update({
      where: {
        userId_organizationId: { userId: targetUserId, organizationId },
      },
      data: { role },
    });
  }
}
