import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsEnum,
} from 'class-validator';
import { RoleCode } from '@prisma/client';

export class UpdateRolesDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsEnum(RoleCode, { each: true })
  roles!: RoleCode[];
}
