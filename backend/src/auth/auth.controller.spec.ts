import { Test, TestingModule } from '@nestjs/testing';

import { UserRole } from '../generated/prisma/client';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import type { JwtPayload } from './jwt-payload.interface';

describe('AuthController', () => {
  let controller: AuthController;

  const authService = {
    register: jest.fn(),
    login: jest.fn(),
    me: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('delegates register to AuthService', async () => {
    const dto = {
      companyName: 'Acme',
      adminName: 'Admin',
      email: 'admin@acme.com',
      password: 'password123',
    };
    const response = { access_token: 'token' };
    authService.register.mockResolvedValue(response);

    await expect(controller.register(dto)).resolves.toEqual(response);
    expect(authService.register).toHaveBeenCalledWith(dto);
  });

  it('delegates login to AuthService', async () => {
    const dto = { email: 'admin@acme.com', password: 'password123' };
    const response = { access_token: 'token' };
    authService.login.mockResolvedValue(response);

    await expect(controller.login(dto)).resolves.toEqual(response);
    expect(authService.login).toHaveBeenCalledWith(dto);
  });

  it('delegates me to AuthService', async () => {
    const user: JwtPayload = {
      sub: 'user-1',
      companyId: 'company-1',
      email: 'admin@acme.com',
      role: UserRole.COMPANY_ADMIN,
    };
    const profile = { id: 'user-1', email: user.email };
    authService.me.mockResolvedValue(profile);

    await expect(controller.me(user)).resolves.toEqual(profile);
    expect(authService.me).toHaveBeenCalledWith(user.sub);
  });
});
