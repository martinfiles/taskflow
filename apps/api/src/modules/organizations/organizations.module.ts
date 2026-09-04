import { Module } from '@nestjs/common';
import { OrgMembershipGuard } from '../../common/guards/org-membership.guard';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';

@Module({
  controllers: [OrganizationsController],
  providers: [OrganizationsService, OrgMembershipGuard],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
