import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { configureApplication } from '../src/common/configure-application.js';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('PostgreSQL schema constraints (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let employeeId: number;
  let medicineId: number;
  let lotId: number;
  let supplierId: number;
  let prescriptionId: number;
  let saleId: number;
  let saleItemId: number;
  let stocktakeId: number;
  let accountId: number;
  let receiptId: number;

  async function expectDatabaseCode(operation: Promise<unknown>, code: string) {
    try {
      await operation;
      throw new Error(`Expected PostgreSQL constraint failure ${code}.`);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Expected PostgreSQL')) {
        throw error;
      }
      expect(error).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
      expect((error as Prisma.PrismaClientKnownRequestError).code).toBe(code);
    }
  }

  async function expectCheckConstraint(operation: Promise<unknown>, constraint: string) {
    let failure: unknown;
    try {
      await operation;
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(Error);
    const message = (failure as Error).message;
    expect(message).toContain('23514');
    expect(message).toContain(constraint);
  }

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    configureApplication(app);
    await app.init();
    prisma = app.get(PrismaService);

    const employee = await prisma.employee.create({
      data: { name: `SCHEMA TEST ${Date.now()}`, isWorking: true },
    });
    employeeId = employee.id;
    const account = await prisma.account.create({
      data: {
        employeeId,
        username: `schema-test-${Date.now()}`,
        passwordHash: 'fixture-only-hash',
        isActive: true,
      },
    });
    accountId = account.id;
    const medicine = await prisma.medicine.create({
      data: {
        name: `SCHEMA TEST medicine ${Date.now()}`,
        unit: 'viên',
        sellingPrice: new Prisma.Decimal('10.00'),
        prescriptionRequired: false,
        lowStockThreshold: 0,
        isActive: true,
      },
    });
    medicineId = medicine.id;
    const lot = await prisma.medicineLot.create({
      data: {
        medicineId,
        batchNumber: `ST-${Date.now()}`,
        expiryDate: new Date('2030-01-01T00:00:00.000Z'),
        quantity: 10,
        version: 0n,
      },
    });
    lotId = lot.id;
    const supplier = await prisma.supplier.create({
      data: { name: `SCHEMA TEST supplier ${Date.now()}`, isActive: true },
    });
    supplierId = supplier.id;
    const prescription = await prisma.prescription.create({
      data: {
        prescribedOn: new Date('2026-10-05T00:00:00.000Z'),
        prescriber: 'Fixture prescriber',
        patientInfo: 'Fixture patient',
      },
    });
    prescriptionId = prescription.id;
    const sale = await prisma.sale.create({
      data: { employeeId, prescriptionId },
    });
    saleId = sale.id;
    const saleItem = await prisma.saleItem.create({
      data: { saleId, medicineId, quantity: 1, unitPrice: new Prisma.Decimal('10.00') },
    });
    saleItemId = saleItem.id;
    const stocktake = await prisma.stocktake.create({
      data: { createdByEmployeeId: employeeId },
    });
    stocktakeId = stocktake.id;
    const receipt = await prisma.goodsReceipt.create({
      data: { supplierId, employeeId },
    });
    receiptId = receipt.id;
  }, 120_000);

  afterAll(async () => {
    if (prisma) {
      await prisma.authSession.deleteMany({ where: { accountId } });
      await prisma.stocktakeItem.deleteMany({ where: { stocktakeId } });
      await prisma.stocktake.deleteMany({ where: { id: stocktakeId } });
      await prisma.saleLotAllocation.deleteMany({ where: { saleItemId } });
      await prisma.saleItem.deleteMany({ where: { saleId } });
      await prisma.sale.deleteMany({ where: { employeeId } });
      await prisma.goodsReceiptItem.deleteMany({ where: { goodsReceiptId: receiptId } });
      await prisma.goodsReceipt.deleteMany({ where: { id: receiptId } });
      await prisma.prescriptionItem.deleteMany({ where: { prescriptionId } });
      await prisma.sale.deleteMany({ where: { prescriptionId } });
      await prisma.prescription.deleteMany({ where: { id: prescriptionId } });
      await prisma.medicineLot.deleteMany({ where: { id: lotId } });
      await prisma.account.deleteMany({ where: { id: accountId } });
      await prisma.employee.deleteMany({ where: { id: employeeId } });
      await prisma.supplier.deleteMany({ where: { id: supplierId } });
      await prisma.medicine.deleteMany({ where: { id: medicineId } });
    }
    await app?.close();
  });

  it('rejects negative quantities, money, broken references, and token hashes', async () => {
    await expectCheckConstraint(
      prisma.medicine.create({
        data: {
          name: `SCHEMA TEST negative price ${Date.now()}`,
          unit: 'viên',
          sellingPrice: new Prisma.Decimal('-0.01'),
          prescriptionRequired: false,
          lowStockThreshold: 0,
        },
      }),
      'THUOC_gia_ban_nonnegative_check',
    );
    await expectCheckConstraint(
      prisma.medicineLot.create({
        data: {
          medicineId,
          batchNumber: `NEG-${Date.now()}`,
          expiryDate: new Date('2030-01-01T00:00:00.000Z'),
          quantity: -1,
          version: 0n,
        },
      }),
      'LO_THUOC_so_luong_ton_nonnegative_check',
    );
    await expectDatabaseCode(
      prisma.medicineLot.create({
        data: {
          medicineId: 2_000_000_000,
          batchNumber: `FK-${Date.now()}`,
          expiryDate: new Date('2030-01-01T00:00:00.000Z'),
          quantity: 0,
          version: 0n,
        },
      }),
      'P2003',
    );
    await expectCheckConstraint(
      prisma.goodsReceiptItem.create({
        data: {
          goodsReceiptId: receiptId,
          medicineId,
          plannedBatchNumber: `RC-${Date.now()}`,
          plannedExpiryDate: new Date('2030-01-01T00:00:00.000Z'),
          quantity: 0,
          unitCost: new Prisma.Decimal('0.00'),
        },
      }),
      'CT_PHIEU_NHAP_so_luong_positive_check',
    );
    await expectCheckConstraint(
      prisma.saleItem.create({
        data: { saleId, medicineId, quantity: 0, unitPrice: new Prisma.Decimal('10.00') },
      }),
      'CT_HOA_DON_so_luong_positive_check',
    );
    await expectCheckConstraint(
      prisma.saleLotAllocation.create({
        data: { saleItemId, lotId, quantity: 0 },
      }),
      'CT_XUAT_LO_so_luong_positive_check',
    );
    await expectCheckConstraint(
      prisma.prescriptionItem.create({
        data: {
          prescriptionId,
          originalName: 'Fixture item',
          originalUnit: 'viên',
          prescribedQuantity: 0,
        },
      }),
      'CT_DON_THUOC_so_luong_positive_check',
    );
    await expectCheckConstraint(
      prisma.authSession.create({
        data: { accountId, tokenHash: 'x'.repeat(64), expiresAt: new Date() },
      }),
      'PHIEN_DANG_NHAP_token_hash_hex_check',
    );
  });

  it('accepts uncounted snapshots and zero, and rejects negative actual quantity', async () => {
    const item = await prisma.stocktakeItem.create({
      data: {
        stocktakeId,
        lotId,
        systemQuantity: 10,
        recordedVersion: 0n,
        recordedAt: new Date(),
        actualQuantity: null,
      },
    });
    await expect(
      prisma.stocktakeItem.update({
        where: { id: item.id },
        data: { actualQuantity: 0, reason: 'Đã kiểm đếm, tồn thực tế bằng không.' },
      }),
    ).resolves.toMatchObject({ actualQuantity: 0 });
    await expectCheckConstraint(
      prisma.stocktakeItem.update({
        where: { id: item.id },
        data: { actualQuantity: -1, reason: 'Đã kiểm đếm.' },
      }),
      'CT_KIEM_KE_actual_and_reason_check',
    );
    await expectCheckConstraint(
      prisma.stocktakeItem.update({
        where: { id: item.id },
        data: { actualQuantity: 9, reason: null },
      }),
      'CT_KIEM_KE_actual_and_reason_check',
    );
  });

  it('enforces one non-canceled sale per prescription while preserving history', async () => {
    await expectDatabaseCode(
      prisma.sale.create({ data: { employeeId, prescriptionId } }),
      'P2002',
    );
    await prisma.sale.update({
      where: { id: saleId },
      data: { status: 'DA_HUY', completedAt: null },
    });
    await expect(
      prisma.sale.create({ data: { employeeId, prescriptionId } }),
    ).resolves.toMatchObject({ prescriptionId });
    await expect(
      prisma.sale.create({ data: { employeeId, prescriptionId: null } }),
    ).resolves.toMatchObject({ prescriptionId: null });
    await expect(
      prisma.sale.create({ data: { employeeId, prescriptionId: null } }),
    ).resolves.toMatchObject({ prescriptionId: null });
  });
});
