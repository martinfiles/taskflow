import { Module } from '@nestjs/common';
import { OrgMembershipGuard } from '../../common/guards/org-membership.guard';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, OrgMembershipGuard],
})
export class AnalyticsModule {}
