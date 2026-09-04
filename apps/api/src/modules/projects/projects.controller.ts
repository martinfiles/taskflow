import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentUser,
  AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrgMembershipGuard } from '../../common/guards/org-membership.guard';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @UseGuards(OrgMembershipGuard)
  @Post('organizations/:orgId/projects')
  create(@Param('orgId') orgId: string, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(orgId, dto);
  }

  @UseGuards(OrgMembershipGuard)
  @Get('organizations/:orgId/projects')
  findAll(@Param('orgId') orgId: string) {
    return this.projectsService.findAllForOrg(orgId);
  }

  @Get('projects/:projectId')
  async findOne(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.projectsService.assertProjectMembership(projectId, user.id);
    return this.projectsService.findOne(projectId);
  }

  @Patch('projects/:projectId')
  async update(
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.projectsService.assertProjectMembership(projectId, user.id);
    return this.projectsService.update(projectId, dto);
  }

  @Delete('projects/:projectId')
  async remove(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.projectsService.assertProjectMembership(projectId, user.id);
    return this.projectsService.remove(projectId);
  }
}
