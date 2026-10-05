import { Controller, Get } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { CurrentUser } from '../src/common/auth/current-user.decorator.js';
import type { CurrentUserView } from '../src/common/auth/authenticated-request.js';
import { Roles } from '../src/common/auth/roles.decorator.js';
import { configureApplication } from '../src/common/configure-application.js';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { RoleCode } from '@prisma/client';
import { createHash, randomUUID } from 'node:crypto';
import request from 'supertest';
import type { Response } from 'supertest';
import { hashPassword } from '../src/modules/auth/password.js';
import { UsersService } from '../src/modules/users/users.service.js';
import { ApiException } from '../src/common/errors/api.exception.js';

@Controller('test-probe/warehouse')
class WarehouseProbeController {
  @Get()
  @Roles(RoleCode.QUAN_LY_KHO)
  getWarehouseArea(@CurrentUser() currentUser: CurrentUserView) {
    return { data: { roles: currentUser.roles } };
  }
}

const origin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';
const fixturePrefix = `it-${Date.now()}-${randomUUID().slice(0, 8)}`;
const fixturePassword = 'E2e-Only-Password-42!';
const fixtureUsername = (suffix: string) => `${fixturePrefix}-${suffix}`;

describe('Authentication and staff API (PostgreSQL e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let fixturePasswordHash: string;
  let managerEmployeeId: number;
  let managerAccountId: number;

  async function createFixtureAccount(
    username: string,
    roles: RoleCode[],
    name = `ITEST ${username}`,
  ) {
    return prisma.$transaction(async (tx) => {
      const employee = await tx.employee.create({ data: { name, isWorking: true } });
      const account = await tx.account.create({
        data: {
          employeeId: employee.id,
          username,
          passwordHash: fixturePasswordHash,
          isActive: true,
        },
      });
      const roleRows = await tx.role.findMany({ where: { code: { in: roles } } });
      await tx.accountRole.createMany({
        data: roleRows.map((role) => ({ accountId: account.id, roleId: role.id })),
      });
      return { employeeId: employee.id, accountId: account.id };
    });
  }

  async function countActiveManagersOutsideFixtures() {
    const managers = await prisma.account.findMany({
      where: {
        isActive: true,
        employee: { is: { isWorking: true } },
        roles: { some: { role: { is: { code: RoleCode.QUAN_LY } } } },
      },
      select: { username: true },
    });
    return managers.filter(({ username }) => !username.startsWith(fixturePrefix)).length;
  }

  async function login(username: string, password = fixturePassword) {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('Origin', origin)
      .send({ username, password });
    const setCookie = response.headers['set-cookie']?.[0];
    return { response, cookie: setCookie?.split(';')[0] };
  }

  function expectCode(response: Response, status: number, code: string) {
    expect(response.status).toBe(status);
    expect(response.body.error).toMatchObject({
      code,
      message: expect.any(String),
      details: expect.any(Array),
    });
  }

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [WarehouseProbeController],
    }).compile();
    app = moduleFixture.createNestApplication();
    configureApplication(app);
    await app.init();
    prisma = app.get(PrismaService);

    await prisma.$transaction(
      Object.values(RoleCode).map((code) =>
        prisma.role.upsert({ where: { code }, update: {}, create: { code } }),
      ),
    );
    fixturePasswordHash = await hashPassword(fixturePassword);
    const manager = await createFixtureAccount(
      fixtureUsername('manager'),
      [RoleCode.QUAN_LY],
      `ITEST ${fixturePrefix} manager`,
    );
    managerEmployeeId = manager.employeeId;
    managerAccountId = manager.accountId;
  }, 120_000);

  afterAll(async () => {
    if (prisma) {
      await prisma.account.deleteMany({
        where: { username: { startsWith: fixturePrefix } },
      });
      await prisma.employee.deleteMany({
        where: { name: { startsWith: `ITEST ${fixturePrefix}` } },
      });
    }
    await app?.close();
  });

  it('keeps liveness public, checks readiness, and normalizes 404', async () => {
    const live = await request(app.getHttpServer()).get('/api/v1/health');
    expect(live.status).toBe(200);
    const ready = await request(app.getHttpServer()).get('/api/v1/health/ready');
    expect(ready.status).toBe(200);
    const { cookie } = await login(fixtureUsername('manager'));
    const missing = await request(app.getHttpServer())
      .get('/api/v1/route-that-does-not-exist')
      .set('Cookie', cookie!);
    expectCode(missing, 404, 'NOT_FOUND');
  });

  it('checks write origins, validates bodies, and gives uniform login failures', async () => {
    const noOrigin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username: fixtureUsername('manager'), password: fixturePassword });
    expectCode(noOrigin, 403, 'CSRF_ORIGIN_REJECTED');

    const badOrigin = await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Origin', 'http://localhost:30000')
      .send({});
    expectCode(badOrigin, 403, 'CSRF_ORIGIN_REJECTED');

    const refererFallback = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('Referer', `${origin}/login`)
      .send({ username: fixtureUsername('manager'), password: 'incorrect-password' });
    expectCode(refererFallback, 401, 'INVALID_CREDENTIALS');

    const wrongPassword = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('Origin', origin)
      .send({ username: 'not-a-real-account', password: 'incorrect-password' });
    expectCode(wrongPassword, 401, 'INVALID_CREDENTIALS');

    const invalidBody = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('Origin', origin)
      .send({ username: fixtureUsername('manager'), password: fixturePassword, accountId: 1 });
    expectCode(invalidBody, 400, 'VALIDATION_ERROR');
  });

  it('creates only hashed sessions, reloads current user, and permits repeated logout', async () => {
    const { response: loginResponse, cookie } = await login(fixtureUsername('manager'));
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.data).toMatchObject({
      employeeId: managerEmployeeId,
      username: fixtureUsername('manager'),
      roles: [RoleCode.QUAN_LY],
    });
    const setCookie = loginResponse.headers['set-cookie']?.[0] ?? '';
    expect(setCookie).toContain('Path=/api/v1');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Lax');
    expect(setCookie).toContain('Max-Age=28800');
    expect(setCookie).not.toContain('Secure');
    expect(loginResponse.body).not.toHaveProperty('passwordHash');

    const token = cookie!.slice('pharmacy_session='.length);
    const storedSession = await prisma.authSession.findFirst({
      where: { accountId: managerAccountId },
    });
    expect(storedSession?.tokenHash).toBe(
      createHash('sha256').update(token).digest('hex'),
    );
    expect(storedSession).not.toBeNull();
    expect(JSON.stringify(storedSession)).not.toContain(token);
    expect(storedSession!.expiresAt.getTime() - storedSession!.createdAt.getTime()).toBe(
      8 * 60 * 60 * 1000,
    );

    const me = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Cookie', cookie!);
    expect(me.status).toBe(200);
    expect(me.body.data.accountId).toBe(managerAccountId);

    const renewed = await login(fixtureUsername('manager'));
    expect(renewed.response.status).toBe(200);
    expectCode(
      await request(app.getHttpServer()).get('/api/v1/auth/me').set('Cookie', cookie!),
      401,
      'UNAUTHENTICATED',
    );

    const logout = () => request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Origin', origin)
      .set('Cookie', renewed.cookie!);
    const firstLogout = await logout();
    expect(firstLogout.status).toBe(200);
    expect(firstLogout.headers['set-cookie']?.[0]).toContain('Path=/api/v1');
    expect(firstLogout.headers['set-cookie']?.[0]).toContain('Max-Age=0');
    expect((await logout()).status).toBe(200);
    expectCode(
      await request(app.getHttpServer()).get('/api/v1/auth/me').set('Cookie', renewed.cookie!),
      401,
      'UNAUTHENTICATED',
    );
    const expiredToken = randomUUID().replaceAll('-', '').padEnd(64, '0');
    const expiredHash = createHash('sha256').update(expiredToken).digest('hex');
    await prisma.authSession.create({
      data: {
        accountId: managerAccountId,
        tokenHash: expiredHash,
        createdAt: new Date(Date.now() - 9 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() - 60_000),
      },
    });
    expectCode(
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Cookie', `pharmacy_session=${expiredToken}`),
      401,
      'UNAUTHENTICATED',
    );
  });

  it('creates, edits, assigns multiple roles, and revokes a disabled user session', async () => {
    const { cookie: managerCookie } = await login(fixtureUsername('manager'));
    const username = fixtureUsername('new-staff');
    const created = await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Origin', origin)
      .set('Cookie', managerCookie!)
      .send({
        name: `ITEST ${fixturePrefix} staff`,
        phone: '0900000000',
        username,
        password: fixturePassword,
        roles: [RoleCode.BAN_THUOC],
      });
    expect(created.status).toBe(201);
    expect(created.body.data.account).toMatchObject({
      username,
      isActive: true,
      roles: [RoleCode.BAN_THUOC],
    });
    expect(JSON.stringify(created.body)).not.toContain('passwordHash');
    expect(JSON.stringify(created.body)).not.toContain(fixturePassword);
    const employeeId = created.body.data.id as number;

    const { response: staffLogin, cookie: staffCookie } = await login(username);
    expect(staffLogin.status).toBe(200);

    const assigned = await request(app.getHttpServer())
      .put(`/api/v1/users/${employeeId}/roles`)
      .set('Origin', origin)
      .set('Cookie', managerCookie!)
      .send({ roles: [RoleCode.BAN_THUOC, RoleCode.QUAN_LY_KHO] });
    expect(assigned.status).toBe(200);
    expect(assigned.body.data.account.roles).toEqual(
      expect.arrayContaining([RoleCode.BAN_THUOC, RoleCode.QUAN_LY_KHO]),
    );
    const allowedProbe = await request(app.getHttpServer())
      .get('/api/v1/test-probe/warehouse')
      .set('Cookie', staffCookie!);
    expect(allowedProbe.status).toBe(200);

    const changed = await request(app.getHttpServer())
      .patch(`/api/v1/users/${employeeId}`)
      .set('Origin', origin)
      .set('Cookie', managerCookie!)
      .send({ name: `ITEST ${fixturePrefix} renamed`, phone: null });
    expect(changed.status).toBe(200);
    expect(changed.body.data.name).toContain('renamed');

    const demotedStaff = await request(app.getHttpServer())
      .put(`/api/v1/users/${employeeId}/roles`)
      .set('Origin', origin)
      .set('Cookie', managerCookie!)
      .send({ roles: [RoleCode.BAN_THUOC] });
    expect(demotedStaff.status).toBe(200);
    const recheckDenied = await request(app.getHttpServer())
      .get('/api/v1/test-probe/warehouse')
      .set('Cookie', staffCookie!);
    expect(recheckDenied.status).toBe(403);

    const offWork = await request(app.getHttpServer())
      .patch(`/api/v1/users/${employeeId}`)
      .set('Origin', origin)
      .set('Cookie', managerCookie!)
      .send({ isWorking: false });
    expect(offWork.status).toBe(200);
    expectCode(
      await request(app.getHttpServer()).get('/api/v1/auth/me').set('Cookie', staffCookie!),
      401,
      'UNAUTHENTICATED',
    );
    expectCode((await login(username)).response, 401, 'INVALID_CREDENTIALS');
    await request(app.getHttpServer())
      .patch(`/api/v1/users/${employeeId}`)
      .set('Origin', origin)
      .set('Cookie', managerCookie!)
      .send({ isWorking: true })
      .expect(200);
    expectCode(
      await request(app.getHttpServer()).get('/api/v1/auth/me').set('Cookie', staffCookie!),
      401,
      'UNAUTHENTICATED',
    );
    const reopenedLogin = await login(username);
    expect(reopenedLogin.response.status).toBe(200);
    const currentStaffCookie = reopenedLogin.cookie!;

    const invalidBoolean = await request(app.getHttpServer())
      .patch(`/api/v1/users/${employeeId}`)
      .set('Origin', origin)
      .set('Cookie', managerCookie!)
      .send({ isActive: 'false' });
    expectCode(invalidBoolean, 400, 'VALIDATION_ERROR');
    expect((await prisma.account.findUnique({ where: { username } }))?.isActive).toBe(true);

    const locked = await request(app.getHttpServer())
      .patch(`/api/v1/users/${employeeId}`)
      .set('Origin', origin)
      .set('Cookie', managerCookie!)
      .send({ isActive: false });
    expect(locked.status).toBe(200);
    expectCode(
      await request(app.getHttpServer()).get('/api/v1/auth/me').set('Cookie', currentStaffCookie),
      401,
      'UNAUTHENTICATED',
    );
    expectCode(
      (await login(username)).response,
      401,
      'INVALID_CREDENTIALS',
    );

    const reopened = await request(app.getHttpServer())
      .patch(`/api/v1/users/${employeeId}`)
      .set('Origin', origin)
      .set('Cookie', managerCookie!)
      .send({ isActive: true });
    expect(reopened.status).toBe(200);
    expectCode(
      await request(app.getHttpServer()).get('/api/v1/auth/me').set('Cookie', currentStaffCookie),
      401,
      'UNAUTHENTICATED',
    );
    expect((await login(username)).response.status).toBe(200);
  });

  it('blocks both non-manager roles from every staff method at the backend', async () => {
    const warehouse = await createFixtureAccount(
      fixtureUsername('warehouse'),
      [RoleCode.QUAN_LY_KHO],
    );
    const sales = await createFixtureAccount(
      fixtureUsername('sales'),
      [RoleCode.BAN_THUOC],
    );
    for (const username of [fixtureUsername('warehouse'), fixtureUsername('sales')]) {
      const { cookie } = await login(username);
      const responses = await Promise.all([
        request(app.getHttpServer()).get('/api/v1/users').set('Cookie', cookie!),
        request(app.getHttpServer()).post('/api/v1/users').set('Origin', origin).set('Cookie', cookie!).send({}),
        request(app.getHttpServer()).patch(`/api/v1/users/${managerEmployeeId}`).set('Origin', origin).set('Cookie', cookie!).send({ name: 'blocked' }),
        request(app.getHttpServer()).put(`/api/v1/users/${managerEmployeeId}/roles`).set('Origin', origin).set('Cookie', cookie!).send({ roles: [RoleCode.BAN_THUOC] }),
        request(app.getHttpServer()).get('/api/v1/roles').set('Cookie', cookie!),
      ]);
      for (const response of responses) expectCode(response, 403, 'FORBIDDEN');
    }
    expect(warehouse.employeeId).toBeGreaterThan(0);
    expect(sales.employeeId).toBeGreaterThan(0);
  });

  it('maps duplicate usernames to 409 with no orphan employee and rejects the last manager removal', async () => {
    const { cookie } = await login(fixtureUsername('manager'));
    const racedUsername = fixtureUsername('race');
    const body = {
      name: `ITEST ${fixturePrefix} race`,
      username: racedUsername,
      password: fixturePassword,
      roles: [RoleCode.BAN_THUOC],
    };
    const attempts = await Promise.all([
      request(app.getHttpServer()).post('/api/v1/users').set('Origin', origin).set('Cookie', cookie!).send(body),
      request(app.getHttpServer()).post('/api/v1/users').set('Origin', origin).set('Cookie', cookie!).send(body),
    ]);
    expect(attempts.map((item) => item.status).sort()).toEqual([201, 409]);
    const conflict = attempts.find((item) => item.status === 409)!;
    expectCode(conflict, 409, 'USERNAME_TAKEN');
    expect(await prisma.account.count({ where: { username: racedUsername } })).toBe(1);
    expect(await prisma.employee.count({
      where: { account: { is: { username: racedUsername } } },
    })).toBe(1);

    if (await countActiveManagersOutsideFixtures() === 0) {
      const disabled = await request(app.getHttpServer())
        .patch(`/api/v1/users/${managerEmployeeId}`)
        .set('Origin', origin)
        .set('Cookie', cookie!)
        .send({ isActive: false });
      expectCode(disabled, 409, 'LAST_ACTIVE_MANAGER');
      const demoted = await request(app.getHttpServer())
        .put(`/api/v1/users/${managerEmployeeId}/roles`)
        .set('Origin', origin)
        .set('Cookie', cookie!)
        .send({ roles: [RoleCode.QUAN_LY_KHO] });
      expectCode(demoted, 409, 'LAST_ACTIVE_MANAGER');
      expect((await prisma.account.findUnique({ where: { id: managerAccountId } }))?.isActive).toBe(true);
      expect(await prisma.accountRole.count({
        where: { accountId: managerAccountId, role: { code: RoleCode.QUAN_LY } },
      })).toBe(1);
    }
    expect(
      (
        await request(app.getHttpServer())
          .get('/api/v1/auth/me')
          .set('Cookie', cookie!)
      ).status,
    ).toBe(200);
  });

  it('retains an active manager when two manager demotions race in PostgreSQL', async () => {
    const secondManager = await createFixtureAccount(
      fixtureUsername('manager-two'),
      [RoleCode.QUAN_LY],
    );
    const externalManagers = await countActiveManagersOutsideFixtures();
    const users = app.get(UsersService);
    const results = await Promise.allSettled([
      users.replaceRoles(managerEmployeeId, [RoleCode.BAN_THUOC]),
      users.replaceRoles(secondManager.employeeId, [RoleCode.QUAN_LY_KHO]),
    ]);
    if (externalManagers === 0) {
      expect(results.map((item) => item.status).sort()).toEqual(['fulfilled', 'rejected']);
      const rejected = results.find((item) => item.status === 'rejected');
      expect(rejected).toBeDefined();
      expect((rejected as PromiseRejectedResult).reason).toBeInstanceOf(ApiException);
      expect(((rejected as PromiseRejectedResult).reason as ApiException).code).toBe(
        'LAST_ACTIVE_MANAGER',
      );
    } else {
      expect(results.every((item) => item.status === 'fulfilled')).toBe(true);
    }
    expect(await prisma.account.count({
      where: {
        isActive: true,
        employee: { is: { isWorking: true } },
        roles: { some: { role: { code: RoleCode.QUAN_LY } } },
      },
    })).toBeGreaterThanOrEqual(externalManagers > 0 ? externalManagers : 1);
  });
});
