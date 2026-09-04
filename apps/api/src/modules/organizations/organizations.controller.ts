import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  CurrentUser,
  AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrgMembershipGuard } from '../../common/guards/org-membership.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { OrganizationsService } from './organizations.service';

@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @ApiOperation({ summary: 'Create an organization (caller becomes OWNER)' })
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOrganizationDto,
  ) {
    return this.organizationsService.create(user.id, dto);
  }

  @ApiOperation({ summary: 'List organizations the current user belongs to' })
  @Get()
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.organizationsService.findMyOrganizations(user.id);
  }

  @ApiOperation({ summary: 'Accept a pending invitation by its token' })
  @Post('invitations/:token/accept')
  acceptInvitation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('token') token: string,
  ) {
    return this.organizationsService.acceptInvitation(user.id, token);
  }

  @ApiOperation({ summary: 'List members of an organization' })
  @UseGuards(OrgMembershipGuard)
  @Get(':orgId/members')
  listMembers(@Param('orgId') orgId: string) {
    return this.organizationsService.listMembers(orgId);
  }

  @ApiOperation({ summary: 'Invite a new member by email (OWNER/ADMIN only)' })
  @UseGuards(OrgMembershipGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  @Post(':orgId/invitations')
  invite(@Param('orgId') orgId: string, @Body() dto: InviteMemberDto) {
    return this.organizationsService.invite(orgId, dto);
  }

  @ApiOperation({ summary: "Change a member's role (OWNER/ADMIN only)" })
  @UseGuards(OrgMembershipGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  @Patch(':orgId/members/:userId')
  updateMemberRole(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberRoleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organizationsService.updateMemberRole(
      orgId,
      userId,
      dto.role,
      user.id,
    );
  }
}
