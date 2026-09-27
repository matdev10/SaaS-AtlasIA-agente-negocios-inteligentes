import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { UserRole } from '../generated/prisma/client';
import { ROLES_KEY } from './roles.decorator';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  };

  const guard = new RolesGuard(reflector as unknown as Reflector);

  const createContext = (role?: UserRole): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          user: role
            ? {
                sub: 'user-1',
                companyId: 'company-1',
                email: 'user@acme.com',
                role,
              }
            : undefined,
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows access when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(createContext(UserRole.COMPANY_USER))).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      expect.anything(),
      expect.anything(),
    ]);
  });

  it('allows access when user has a required role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.COMPANY_ADMIN]);

    expect(guard.canActivate(createContext(UserRole.COMPANY_ADMIN))).toBe(true);
  });

  it('rejects access when user lacks a required role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.COMPANY_ADMIN]);

    expect(() =>
      guard.canActivate(createContext(UserRole.COMPANY_USER)),
    ).toThrow(ForbiddenException);
  });

  it('rejects access when user is missing', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.COMPANY_ADMIN]);

    expect(() => guard.canActivate(createContext())).toThrow(
      ForbiddenException,
    );
  });
});
