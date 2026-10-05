import { Injectable } from '@nestjs/common';
import {
  Prisma,
  RoleCode,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ApiException } from '../../common/errors/api.exception.js';
import { withSerializableRetries } from '../../common/prisma/serializable-retries.js';
import { hashPassword } from '../auth/password.js';
import type { CreateUserDto } from './create-user.dto.js';
import type { ListUsersQueryDto } from './list-users-query.dto.js';
import type { UpdateUserDto } from './update-user.dto.js';

const employeeViewInclude = {
  account: { include: { roles: { include: { role: true } } } },
} satisfies Prisma.EmployeeInclude;

type EmployeeViewRow = Prisma.EmployeeGetPayload<{
  include: typeof employeeViewInclude;
}>;
type EmployeeReader = { employee: PrismaService['employee'] };

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListUsersQueryDto) {
    const page = Number.isInteger(query.page) ? query.page : 1;
    const pageSize = Number.isInteger(query.pageSize) ? query.pageSize : 20;
    const search = query.search?.trim();
    const where: Prisma.EmployeeWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
            {
              account: {
                is: { username: { contains: search, mode: 'insensitive' } },
              },
            },
          ],
        }
      : {};
    const [rows, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        include: employeeViewInclude,
        orderBy: { id: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.employee.count({ where }),
    ]);
    return {
      data: rows.map((row) => this.toView(row)),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async create(input: CreateUserDto) {
    const passwordHash = await hashPassword(input.password);
    try {
      const row = await withSerializableRetries(this.prisma, async (tx) => {
        const roleRows = await tx.role.findMany({
          where: { code: { in: input.roles } },
        });
        if (roleRows.length !== input.roles.length) {
          throw new ApiException(400, 'VALIDATION_ERROR', 'Vai trò không hợp lệ.');
        }
        const employee = await tx.employee.create({
          data: {
            name: input.name,
            phone: input.phone || null,
            isWorking: true,
          },
        });
        const account = await tx.account.create({
          data: {
            employeeId: employee.id,
            username: input.username,
            passwordHash,
            isActive: true,
          },
        });
        await tx.accountRole.createMany({
          data: roleRows.map((role) => ({ accountId: account.id, roleId: role.id })),
        });
        return this.findView(tx, employee.id);
      });
      return { data: this.toView(row) };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ApiException(
          409,
          'USERNAME_TAKEN',
          'Tên đăng nhập đã được sử dụng.',
        );
      }
      throw error;
    }
  }

  async update(employeeId: number, input: UpdateUserDto) {
    this.assertId(employeeId);
    const keys = Object.keys(input);
    if (!keys.length) {
      throw new ApiException(400, 'VALIDATION_ERROR', 'Cần ít nhất một trường để cập nhật.');
    }
    const changesStatus = input.isWorking !== undefined || input.isActive !== undefined;
    const row = await withSerializableRetries(this.prisma, async (tx) => {
      const current = await tx.employee.findUnique({
        where: { id: employeeId },
        include: { account: true },
      });
      if (!current) {
        throw new ApiException(404, 'NOT_FOUND', 'Không tìm thấy nhân viên.');
      }
      if (input.isActive !== undefined && !current.account) {
        throw new ApiException(
          409,
          'ACCOUNT_NOT_FOUND',
          'Nhân viên chưa có tài khoản để cập nhật trạng thái.',
        );
      }

      const employeeData: Prisma.EmployeeUpdateInput = {};
      if (input.name !== undefined) employeeData.name = input.name;
      if (input.phone !== undefined) employeeData.phone = input.phone;
      if (input.isWorking !== undefined) employeeData.isWorking = input.isWorking;
      if (Object.keys(employeeData).length) {
        await tx.employee.update({ where: { id: employeeId }, data: employeeData });
      }
      if (input.isActive !== undefined && current.account) {
        await tx.account.update({
          where: { id: current.account.id },
          data: { isActive: input.isActive },
        });
      }
      if (
        current.account &&
        (input.isActive === false || input.isWorking === false)
      ) {
        await tx.authSession.deleteMany({
          where: { accountId: current.account.id },
        });
      }
      if (changesStatus) await this.assertActiveManagerRemains(tx);
      return this.findView(tx, employeeId);
    });
    return { data: this.toView(row) };
  }

  async replaceRoles(employeeId: number, roles: RoleCode[]) {
    this.assertId(employeeId);
    const row = await withSerializableRetries(this.prisma, async (tx) => {
      const employee = await tx.employee.findUnique({
        where: { id: employeeId },
        include: { account: true },
      });
      if (!employee) {
        throw new ApiException(404, 'NOT_FOUND', 'Không tìm thấy nhân viên.');
      }
      if (!employee.account) {
        throw new ApiException(
          409,
          'ACCOUNT_NOT_FOUND',
          'Nhân viên chưa có tài khoản để gán vai trò.',
        );
      }
      const roleRows = await tx.role.findMany({ where: { code: { in: roles } } });
      if (roleRows.length !== roles.length) {
        throw new ApiException(400, 'VALIDATION_ERROR', 'Vai trò không hợp lệ.');
      }
      await tx.accountRole.deleteMany({
        where: { accountId: employee.account.id },
      });
      await tx.accountRole.createMany({
        data: roleRows.map((role) => ({
          accountId: employee.account!.id,
          roleId: role.id,
        })),
      });
      await this.assertActiveManagerRemains(tx);
      return this.findView(tx, employeeId);
    });
    return { data: this.toView(row) };
  }

  private async assertActiveManagerRemains(tx: Prisma.TransactionClient) {
    const count = await tx.account.count({
      where: {
        isActive: true,
        employee: { is: { isWorking: true } },
        roles: { some: { role: { is: { code: RoleCode.QUAN_LY } } } },
      },
    });
    if (count === 0) {
      throw new ApiException(
        409,
        'LAST_ACTIVE_MANAGER',
        'Hệ thống phải còn ít nhất một tài khoản quản lý đang hoạt động.',
      );
    }
  }

  private async findView(client: EmployeeReader, employeeId: number) {
    const row = await client.employee.findUnique({
      where: { id: employeeId },
      include: employeeViewInclude,
    });
    if (!row) throw new ApiException(404, 'NOT_FOUND', 'Không tìm thấy nhân viên.');
    return row;
  }

  private toView(row: EmployeeViewRow) {
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      isWorking: row.isWorking,
      account: row.account
        ? {
            id: row.account.id,
            username: row.account.username,
            isActive: row.account.isActive,
            roles: row.account.roles.map(({ role }) => role.code),
          }
        : null,
    };
  }

  private assertId(employeeId: number) {
    if (!Number.isInteger(employeeId) || employeeId <= 0) {
      throw new ApiException(400, 'VALIDATION_ERROR', 'Mã nhân viên không hợp lệ.');
    }
  }
}
