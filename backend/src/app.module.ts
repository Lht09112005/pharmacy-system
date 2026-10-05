import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnvironment } from './config/environment.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { RolesModule } from './modules/roles/roles.module.js';
import { MedicinesModule } from './modules/medicines/medicines.module.js';
import { SuppliersModule } from './modules/suppliers/suppliers.module.js';
import { InventoryModule } from './modules/inventory/inventory.module.js';
import { GoodsReceiptsModule } from './modules/goods-receipts/goods-receipts.module.js';
import { StocktakesModule } from './modules/stocktakes/stocktakes.module.js';
import { CustomersModule } from './modules/customers/customers.module.js';
import { PrescriptionsModule } from './modules/prescriptions/prescriptions.module.js';
import { SalesModule } from './modules/sales/sales.module.js';
import { ReportsModule } from './modules/reports/reports.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnvironment,
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    RolesModule,
    MedicinesModule,
    SuppliersModule,
    InventoryModule,
    GoodsReceiptsModule,
    StocktakesModule,
    CustomersModule,
    PrescriptionsModule,
    SalesModule,
    ReportsModule,
  ],
})
export class AppModule {}
