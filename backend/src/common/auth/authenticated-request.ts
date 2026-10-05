import type { Request } from 'express';
import type { RoleCode } from '@prisma/client';

export type CurrentUserView = {
  accountId: number;
  employeeId: number;
  username: string;
  name: string;
  roles: RoleCode[];
};

export interface AuthenticatedRequest extends Request {
  currentUser?: CurrentUserView;
}
