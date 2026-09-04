import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Requires a JwtAuthGuard to run first (relies on request.user).
 * Resolves the caller's Membership for the `:orgId` route param and
 * attaches it as request.membership so RolesGuard / services can use it.
 */
@Injectable()
export class OrgMembershipGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const orgId = request.params.orgId;
    const userId = request.user?.id;

    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    request.membership = membership;
    return true;
  }
}
