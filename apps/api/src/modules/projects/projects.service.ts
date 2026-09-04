import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

const DEFAULT_COLUMNS = ['Backlog', 'In Progress', 'Done'];

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        organizationId,
        columns: {
          create: DEFAULT_COLUMNS.map((name, order) => ({ name, order })),
        },
      },
      include: { columns: { orderBy: { order: 'asc' } } },
    });
  }

  async findAllForOrg(organizationId: string) {
    return this.prisma.project.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        columns: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              orderBy: { position: 'asc' },
              include: {
                assignees: {
                  include: {
                    user: { select: { id: true, name: true, avatarUrl: true } },
                  },
                },
                labels: { include: { label: true } },
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(projectId: string, dto: UpdateProjectDto) {
    await this.findOne(projectId);
    return this.prisma.project.update({ where: { id: projectId }, data: dto });
  }

  async remove(projectId: string) {
    await this.findOne(projectId);
    await this.prisma.project.delete({ where: { id: projectId } });
    return { id: projectId, deleted: true };
  }

  /**
   * Verifies the given user belongs to the organization that owns this project.
   * Used by routes scoped by :projectId or :taskId rather than :orgId.
   */
  async assertProjectMembership(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, organizationId: true },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: project.organizationId,
        },
      },
    });
    if (!membership) {
      throw new ForbiddenException(
        'You are not a member of this project organization',
      );
    }

    return { project, membership };
  }
}
