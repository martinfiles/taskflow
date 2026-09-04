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
import { ProjectsService } from '../projects/projects.service';
import { AssignTaskDto } from './dto/assign-task.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly projectsService: ProjectsService,
  ) {}

  @Post('projects/:projectId/tasks')
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.projectsService.assertProjectMembership(projectId, user.id);
    return this.tasksService.create(projectId, user.id, dto);
  }

  @Patch('tasks/:taskId')
  async update(
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const task = await this.tasksService.findTaskOrThrow(taskId);
    await this.projectsService.assertProjectMembership(task.projectId, user.id);
    return this.tasksService.update(taskId, dto);
  }

  @Patch('tasks/:taskId/move')
  async move(
    @Param('taskId') taskId: string,
    @Body() dto: MoveTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const task = await this.tasksService.findTaskOrThrow(taskId);
    await this.projectsService.assertProjectMembership(task.projectId, user.id);
    return this.tasksService.move(taskId, dto);
  }

  @Delete('tasks/:taskId')
  async remove(
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const task = await this.tasksService.findTaskOrThrow(taskId);
    await this.projectsService.assertProjectMembership(task.projectId, user.id);
    return this.tasksService.remove(taskId);
  }

  @Post('tasks/:taskId/assignees')
  async assign(
    @Param('taskId') taskId: string,
    @Body() dto: AssignTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const task = await this.tasksService.findTaskOrThrow(taskId);
    await this.projectsService.assertProjectMembership(task.projectId, user.id);
    return this.tasksService.assign(taskId, dto.userId);
  }

  @Delete('tasks/:taskId/assignees/:userId')
  async unassign(
    @Param('taskId') taskId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const task = await this.tasksService.findTaskOrThrow(taskId);
    await this.projectsService.assertProjectMembership(task.projectId, user.id);
    return this.tasksService.unassign(taskId, userId);
  }

  @Post('tasks/:taskId/comments')
  async addComment(
    @Param('taskId') taskId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const task = await this.tasksService.findTaskOrThrow(taskId);
    await this.projectsService.assertProjectMembership(task.projectId, user.id);
    return this.tasksService.addComment(taskId, user.id, dto);
  }

  @Get('tasks/:taskId/comments')
  async listComments(
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const task = await this.tasksService.findTaskOrThrow(taskId);
    await this.projectsService.assertProjectMembership(task.projectId, user.id);
    return this.tasksService.listComments(taskId);
  }
}
