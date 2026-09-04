import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrgMembershipGuard } from '../../common/guards/org-membership.guard';
import { AnalyticsService } from './analytics.service';

@UseGuards(JwtAuthGuard, OrgMembershipGuard)
@Controller('organizations/:orgId/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  get(@Param('orgId') orgId: string) {
    return this.analyticsService.getOrganizationAnalytics(orgId);
  }
}
