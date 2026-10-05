import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { RoleCode } from '@prisma/client';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { hashPassword } from '../src/modules/auth/password.js';
import { appForDatabaseTests } from './test-app.js';

describe('Demo seed (PostgreSQL e2e)', () => {
  const fixturePassword = 'Seed-Only-Test-Password-89!';
  let prisma: PrismaService;
  let app: Awaited<ReturnType<typeof appForDatabaseTests>>;

  function runSeed() {
    const result = spawnSync(
      process.execPath,
      ['--env-file-if-exists=.env', '--import', 'tsx', 'prisma/seed.ts'],
      {
        cwd: resolve(process.cwd()),
        env: {
          ...process.env,
          DATABASE_URL: process.env.TEST_DATABASE_URL,
          NODE_ENV: 'test',
          SEED_DEMO_PASSWORD: fixturePassword,
        },
        encoding: 'utf8',
      },
    );
    if (result.error) throw result.error;
    if (result.status !== 0) {
      throw new Error(`Seed process exited ${result.status}: ${result.stderr}`);
    }
  }

  beforeAll(async () => {
    app = await appForDatabaseTests();
    prisma = app.prisma;
  }, 120_000);

  afterAll(async () => app?.app.close());

  it('is repeatable and does not overwrite an existing demo account', async () => {
    runSeed();
    const account = await prisma.account.findUniqueOrThrow({
      where: { username: 'manager.demo' },
      include: { employee: true, roles: { include: { role: true } } },
    });
    const beforeCounts = {
      demoAccounts: await prisma.account.count({
        where: { username: { in: ['manager.demo', 'warehouse.demo', 'sales.demo'] } },
      }),
      demoMedicines: await prisma.medicine.count({ where: { name: { startsWith: 'DEMO · ' } } }),
      demoSuppliers: await prisma.supplier.count({ where: { name: 'DEMO · Nhà cung cấp mẫu' } }),
      lots: await prisma.medicineLot.count(),
      receipts: await prisma.goodsReceipt.count(),
      customers: await prisma.customer.count(),
      prescriptions: await prisma.prescription.count(),
      sales: await prisma.sale.count(),
      stocktakes: await prisma.stocktake.count(),
    };
    const original = {
      isActive: account.isActive,
      isWorking: account.employee.isWorking,
      passwordHash: account.passwordHash,
      roleIds: account.roles.map(({ roleId }) => roleId),
    };
    const changedPasswordHash = await hashPassword('Changed-By-Test-Only-Password-7!');
    const salesRole = await prisma.role.findUniqueOrThrow({ where: { code: RoleCode.BAN_THUOC } });
    try {
      await prisma.$transaction(async (tx) => {
        await tx.account.update({
          where: { id: account.id },
          data: { isActive: false, passwordHash: changedPasswordHash },
        });
        await tx.employee.update({
          where: { id: account.employeeId },
          data: { isWorking: false },
        });
        await tx.accountRole.deleteMany({ where: { accountId: account.id } });
        await tx.accountRole.create({
          data: { accountId: account.id, roleId: salesRole.id },
        });
      });

      runSeed();
      const after = await prisma.account.findUniqueOrThrow({
        where: { id: account.id },
        include: { employee: true, roles: { include: { role: true } } },
      });
      expect(after.isActive).toBe(false);
      expect(after.employee.isWorking).toBe(false);
      expect(after.passwordHash).toBe(changedPasswordHash);
      expect(after.roles.map(({ role }) => role.code)).toEqual([RoleCode.BAN_THUOC]);
      expect(await prisma.account.count({
        where: { username: { in: ['manager.demo', 'warehouse.demo', 'sales.demo'] } },
      })).toBe(beforeCounts.demoAccounts);
      expect(await prisma.medicine.count({ where: { name: { startsWith: 'DEMO · ' } } })).toBe(
        beforeCounts.demoMedicines,
      );
      expect(await prisma.supplier.count({ where: { name: 'DEMO · Nhà cung cấp mẫu' } })).toBe(
        beforeCounts.demoSuppliers,
      );
      expect(await prisma.medicineLot.count()).toBe(beforeCounts.lots);
      expect(await prisma.goodsReceipt.count()).toBe(beforeCounts.receipts);
      expect(await prisma.customer.count()).toBe(beforeCounts.customers);
      expect(await prisma.prescription.count()).toBe(beforeCounts.prescriptions);
      expect(await prisma.sale.count()).toBe(beforeCounts.sales);
      expect(await prisma.stocktake.count()).toBe(beforeCounts.stocktakes);
    } finally {
      await prisma.$transaction(async (tx) => {
        await tx.account.update({
          where: { id: account.id },
          data: { isActive: original.isActive, passwordHash: original.passwordHash },
        });
        await tx.employee.update({
          where: { id: account.employeeId },
          data: { isWorking: original.isWorking },
        });
        await tx.accountRole.deleteMany({ where: { accountId: account.id } });
        await tx.accountRole.createMany({
          data: original.roleIds.map((roleId) => ({ accountId: account.id, roleId })),
        });
      });
    }
  });
});
