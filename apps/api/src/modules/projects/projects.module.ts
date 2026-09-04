import { Module } from '@nestjs/common';
import { OrgMembershipGuard } from '../../common/guards/org-membership.guard';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService, OrgMembershipGuard],
  exports: [ProjectsService],
})
export class ProjectsModule {}
