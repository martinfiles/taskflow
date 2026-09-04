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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrgMembershipGuard } from '../../common/guards/org-membership.guard';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @ApiOperation({ summary: 'Create a project with default Kanban columns' })
  @UseGuards(OrgMembershipGuard)
  @Post('organizations/:orgId/projects')
  create(@Param('orgId') orgId: string, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(orgId, dto);
  }

  @ApiOperation({ summary: 'List all projects for an organization' })
  @UseGuards(OrgMembershipGuard)
  @Get('organizations/:orgId/projects')
  findAll(@Param('orgId') orgId: string) {
    return this.projectsService.findAllForOrg(orgId);
  }

  @ApiOperation({ summary: 'Get a project with its columns and tasks' })
  @Get('projects/:projectId')
  async findOne(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.projectsService.assertProjectMembership(projectId, user.id);
    return this.projectsService.findOne(projectId);
  }

  @ApiOperation({ summary: 'Update a project' })
  @Patch('projects/:projectId')
  async update(
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.projectsService.assertProjectMembership(projectId, user.id);
    return this.projectsService.update(projectId, dto);
  }

  @ApiOperation({ summary: 'Delete a project' })
  @Delete('projects/:projectId')
  async remove(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.projectsService.assertProjectMembership(projectId, user.id);
    return this.projectsService.remove(projectId);
  }
}
