import { Injectable } from '@nestjs/common';
import { RoleCode } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';

const roleLabels: Record<RoleCode, string> = {
  BAN_THUOC: 'Bán thuốc',
  QUAN_LY_KHO: 'Quản lý kho',
  QUAN_LY: 'Quản lý',
};
const roleOrder = [RoleCode.BAN_THUOC, RoleCode.QUAN_LY_KHO, RoleCode.QUAN_LY];

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const roles = await this.prisma.role.findMany();
    roles.sort((left, right) => roleOrder.indexOf(left.code) - roleOrder.indexOf(right.code));
    return {
      data: roles.map(({ code }) => ({ code, label: roleLabels[code] })),
    };
  }
}
