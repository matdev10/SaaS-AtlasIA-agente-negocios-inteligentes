import { UserRole } from '../generated/prisma/client';

export interface JwtPayload {
  sub: string;
  companyId: string;
  email: string;
  role: UserRole;
}
