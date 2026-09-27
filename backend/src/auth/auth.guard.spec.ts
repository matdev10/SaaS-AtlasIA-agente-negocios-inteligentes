import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { UserRole } from '../generated/prisma/client';
import { AuthGuard } from './auth.guard';
import { JwtPayload } from './jwt-payload.interface';

describe('AuthGuard', () => {
  let guard: AuthGuard;

  const jwtService = {
    verifyAsync: jest.fn(),
  };

  const createContext = (authorization?: string): ExecutionContext => {
    const request = {
      headers: { authorization },
      user: undefined as JwtPayload | undefined,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
  });

  it('allows requests with a valid bearer token', async () => {
    const payload: JwtPayload = {
      sub: 'user-1',
      companyId: 'company-1',
      email: 'admin@acme.com',
      role: UserRole.COMPANY_ADMIN,
    };

    jwtService.verifyAsync.mockResolvedValue(payload);

    const context = createContext('Bearer valid-token');
    const request = context.switchToHttp().getRequest();

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual(payload);
  });

  it('rejects missing authorization header', async () => {
    await expect(guard.canActivate(createContext())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects non-bearer tokens', async () => {
    await expect(
      guard.canActivate(createContext('Basic abc')),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects expired or invalid tokens', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

    await expect(
      guard.canActivate(createContext('Bearer expired')),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects payloads without required claims', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      email: 'admin@acme.com',
    });

    await expect(
      guard.canActivate(createContext('Bearer incomplete')),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
