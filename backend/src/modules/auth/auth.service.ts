import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ApiException } from '../../common/errors/api.exception.js';
import { withSerializableRetries } from '../../common/prisma/serializable-retries.js';
import type { CurrentUserView } from '../../common/auth/authenticated-request.js';
import { normalizeUsername, verifyPassword } from './password.js';

const sessionLifetimeMs = 8 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(usernameInput: string, password: string) {
    const username = normalizeUsername(usernameInput);
    if (username.length < 3 || !/^[a-z0-9._-]+$/.test(username)) {
      throw new ApiException(
        401,
        'INVALID_CREDENTIALS',
        'Tên đăng nhập hoặc mật khẩu không đúng.',
      );
    }
    const account = await this.prisma.account.findUnique({
      where: { username },
      include: {
        employee: true,
        roles: { include: { role: true } },
      },
    });
    if (!account || !(await verifyPassword(password, account.passwordHash))) {
      throw new ApiException(
        401,
        'INVALID_CREDENTIALS',
        'Tên đăng nhập hoặc mật khẩu không đúng.',
      );
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + sessionLifetimeMs);
    const currentUser = await withSerializableRetries(this.prisma, async (tx) => {
      const current = await tx.account.findUnique({
        where: { id: account.id },
        include: { employee: true, roles: { include: { role: true } } },
      });
      if (!current || !current.isActive || !current.employee.isWorking) {
        throw new ApiException(
          401,
          'INVALID_CREDENTIALS',
          'Tên đăng nhập hoặc mật khẩu không đúng.',
        );
      }
      await tx.authSession.deleteMany({ where: { accountId: current.id } });
      await tx.authSession.create({
        data: { accountId: current.id, tokenHash, createdAt, expiresAt },
      });
      return this.toCurrentUser(current);
    });

    return { token, createdAt, expiresAt, currentUser };
  }

  async logout(cookieHeader: string | undefined) {
    const token = this.extractToken(cookieHeader);
    if (token) {
      const tokenHash = createHash('sha256').update(token).digest('hex');
      await this.prisma.authSession.deleteMany({ where: { tokenHash } });
    }
    return { success: true };
  }

  toCurrentUser(account: {
    id: number;
    username: string;
    employee: { id: number; name: string };
    roles: { role: { code: CurrentUserView['roles'][number] } }[];
  }): CurrentUserView {
    return {
      accountId: account.id,
      employeeId: account.employee.id,
      username: account.username,
      name: account.employee.name,
      roles: account.roles.map(({ role }) => role.code),
    };
  }

  private extractToken(cookieHeader: string | undefined) {
    if (!cookieHeader) return undefined;
    const cookie = cookieHeader
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith('pharmacy_session='));
    const token = cookie?.slice('pharmacy_session='.length);
    return token && /^[a-f0-9]{64}$/i.test(token) ? token : undefined;
  }
}
