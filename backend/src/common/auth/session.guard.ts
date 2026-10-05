import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { createHash } from 'node:crypto';
import { ApiException } from '../errors/api.exception.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { IS_PUBLIC_KEY } from './public.decorator.js';
import type { AuthenticatedRequest } from './authenticated-request.js';

const cookieName = 'pharmacy_session';
const writeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function readSessionToken(cookieHeader: string | undefined) {
  if (!cookieHeader) return undefined;
  const item = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`));
  if (!item) return undefined;
  const token = item.slice(cookieName.length + 1);
  return /^[a-f0-9]{64}$/i.test(token) ? token : undefined;
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();
    const allowedOrigin = this.config.getOrThrow<string>('FRONTEND_ORIGIN');

    if (writeMethods.has(request.method)) {
      const origin = request.headers.origin;
      let accepted = false;
      if (origin !== undefined) {
        accepted = origin === allowedOrigin;
      } else {
        const referer = request.headers.referer;
        if (referer) {
          try {
            accepted = new URL(referer).origin === allowedOrigin;
          } catch {
            accepted = false;
          }
        }
      }
      if (!accepted) {
        throw new ApiException(
          403,
          'CSRF_ORIGIN_REJECTED',
          'Nguồn yêu cầu không được chấp nhận.',
        );
      }
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const token = readSessionToken(request.headers.cookie);
    if (!token) throw new UnauthorizedException();
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const session = await this.prisma.authSession.findUnique({
      where: { tokenHash },
      include: {
        account: {
          include: {
            employee: true,
            roles: { include: { role: true } },
          },
        },
      },
    });
    if (
      !session ||
      session.expiresAt.getTime() <= Date.now() ||
      !session.account.isActive ||
      !session.account.employee.isWorking
    ) {
      throw new UnauthorizedException();
    }

    request.currentUser = {
      accountId: session.account.id,
      employeeId: session.account.employee.id,
      username: session.account.username,
      name: session.account.employee.name,
      roles: session.account.roles.map(({ role }) => role.code),
    };
    return true;
  }
}
