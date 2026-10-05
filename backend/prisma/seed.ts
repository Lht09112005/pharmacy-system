import { Prisma, PrismaClient, RoleCode } from '@prisma/client';
import { hashPassword, normalizeUsername } from '../src/modules/auth/password.js';

const prisma = new PrismaClient();
const demoUsers = [
  {
    username: 'manager.demo',
    name: 'Quản lý demo',
    role: RoleCode.QUAN_LY,
  },
  {
    username: 'warehouse.demo',
    name: 'Nhân viên kho demo',
    role: RoleCode.QUAN_LY_KHO,
  },
  {
    username: 'sales.demo',
    name: 'Nhân viên bán thuốc demo',
    role: RoleCode.BAN_THUOC,
  },
] as const;

const demoMedicines = [
  {
    name: 'DEMO · Vitamin C mẫu 500 mg',
    activeIngredient: 'Ascorbic acid (demo)',
    strength: '500 mg',
    dosageForm: 'Viên nén',
    unit: 'viên',
    sellingPrice: new Prisma.Decimal('3500.00'),
    prescriptionRequired: false,
    lowStockThreshold: 10,
  },
  {
    name: 'DEMO · Nước muối mẫu 0,9%',
    activeIngredient: 'Sodium chloride (demo)',
    strength: '0,9%',
    dosageForm: 'Dung dịch',
    unit: 'chai',
    sellingPrice: new Prisma.Decimal('12000.00'),
    prescriptionRequired: false,
    lowStockThreshold: 5,
  },
  {
    name: 'DEMO · Paracetamol mẫu 500 mg',
    activeIngredient: 'Paracetamol (demo)',
    strength: '500 mg',
    dosageForm: 'Viên nén',
    unit: 'viên',
    sellingPrice: new Prisma.Decimal('1000.00'),
    prescriptionRequired: false,
    lowStockThreshold: 20,
  },
] as const;

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Không được chạy seed demo trong môi trường production.');
  }
  const password = process.env.SEED_DEMO_PASSWORD;
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    throw new Error('Đặt SEED_DEMO_PASSWORD dài từ 8 đến 128 ký tự trước khi seed.');
  }

  const roleRows = await prisma.$transaction(
    Object.values(RoleCode).map((code) =>
      prisma.role.upsert({
        where: { code },
        update: {},
        create: { code },
      }),
    ),
  );

  for (const demo of demoUsers) {
    const username = normalizeUsername(demo.username);
    const existing = await prisma.account.findUnique({ where: { username } });
    if (existing) continue;
    const passwordHash = await hashPassword(password);
    const role = roleRows.find(({ code }) => code === demo.role);
    if (!role) throw new Error('Thiếu vai trò demo trong bảng VAI_TRO.');
    try {
      await prisma.$transaction(async (tx) => {
        const employee = await tx.employee.create({
          data: { name: demo.name, isWorking: true },
        });
        const account = await tx.account.create({
          data: {
            employeeId: employee.id,
            username,
            passwordHash,
            isActive: true,
          },
        });
        await tx.accountRole.create({
          data: { accountId: account.id, roleId: role.id },
        });
      });
    } catch (error) {
      const accountNowExists =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        (await prisma.account.findUnique({ where: { username } }));
      if (!accountNowExists) throw error;
    }
  }

  for (const medicine of demoMedicines) {
    const existing = await prisma.medicine.findFirst({
      where: { name: medicine.name },
      select: { id: true },
    });
    if (!existing) await prisma.medicine.create({ data: medicine });
  }

  const supplierName = 'DEMO · Nhà cung cấp mẫu';
  const supplier = await prisma.supplier.findFirst({
    where: { name: supplierName },
    select: { id: true },
  });
  if (!supplier) {
    await prisma.supplier.create({ data: { name: supplierName, isActive: true } });
  }

  process.stdout.write('Đã kiểm tra/tạo vai trò, tài khoản và danh mục demo.\n');
}

main()
  .catch((error: unknown) => {
    process.stderr.write(
      `Seed thất bại (${error instanceof Error ? error.name : 'unknown error'}).\n`,
    );
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
