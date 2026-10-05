import { Controller, Get } from '@nestjs/common';
import { RoleCode } from '@prisma/client';
import { Roles } from '../../common/auth/roles.decorator.js';
import { RolesService } from './roles.service.js';

@Controller('roles')
@Roles(RoleCode.QUAN_LY)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  list() {
    return this.rolesService.list();
  }
}
