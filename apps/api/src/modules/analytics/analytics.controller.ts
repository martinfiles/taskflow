import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrgMembershipGuard } from '../../common/guards/org-membership.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, OrgMembershipGuard)
@Controller('organizations/:orgId/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @ApiOperation({
    summary:
      'Get organization analytics: completed tasks by week, priority distribution, overdue tasks, workload by member',
  })
  @Get()
  get(@Param('orgId') orgId: string) {
    return this.analyticsService.getOrganizationAnalytics(orgId);
  }
}
