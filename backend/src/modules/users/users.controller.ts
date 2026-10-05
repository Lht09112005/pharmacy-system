import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { RoleCode } from '@prisma/client';
import { Roles } from '../../common/auth/roles.decorator.js';
import { CreateUserDto } from './create-user.dto.js';
import { ListUsersQueryDto } from './list-users-query.dto.js';
import { UpdateRolesDto } from './update-roles.dto.js';
import { UpdateUserDto } from './update-user.dto.js';
import { UsersService } from './users.service.js';

@Controller('users')
@Roles(RoleCode.QUAN_LY)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  list(@Query() query: ListUsersQueryDto) {
    return this.usersService.list(query);
  }

  @Post()
  create(@Body() body: CreateUserDto) {
    return this.usersService.create(body);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserDto,
  ) {
    return this.usersService.update(id, body);
  }

  @Put(':id/roles')
  updateRoles(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateRolesDto,
  ) {
    return this.usersService.replaceRoles(id, body.roles);
  }
}
