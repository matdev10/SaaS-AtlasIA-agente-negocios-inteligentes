import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../database/prisma.service';
import { UserRole, UserStatus } from '../generated/prisma/client';
import { AuthService } from './auth.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const prisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const jwtService = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    const registerDto = {
      companyName: 'Acme',
      adminName: 'Admin',
      email: 'admin@acme.com',
      password: 'password123',
    };

    const createdUser = {
      id: 'user-1',
      companyId: 'company-1',
      name: registerDto.adminName,
      email: registerDto.email,
      role: UserRole.COMPANY_ADMIN,
      status: UserStatus.ACTIVE,
    };

    it('creates the tenant graph and returns an auth response', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      prisma.$transaction.mockResolvedValue(createdUser);
      jwtService.signAsync.mockResolvedValue('jwt-token');

      const result = await service.register(registerDto);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual({
        access_token: 'jwt-token',
        user: {
          id: createdUser.id,
          companyId: createdUser.companyId,
          name: createdUser.name,
          email: createdUser.email,
          role: createdUser.role,
          status: createdUser.status,
          lastLoginAt: expect.any(Date),
        },
      });
    });

    it('throws when email is already registered', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

      await expect(service.register(registerDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'admin@acme.com',
      password: 'password123',
    };

    const user = {
      id: 'user-1',
      companyId: 'company-1',
      name: 'Admin',
      email: loginDto.email,
      passwordHash: 'hashed',
      role: UserRole.COMPANY_ADMIN,
      status: UserStatus.ACTIVE,
    };

    it('returns access token and user when credentials are valid', async () => {
      prisma.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.user.update.mockResolvedValue({ ...user, lastLoginAt: new Date() });
      jwtService.signAsync.mockResolvedValue('jwt-token');

      const result = await service.login(loginDto);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: { lastLoginAt: expect.any(Date) },
      });
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: user.id,
        companyId: user.companyId,
        email: user.email,
        role: user.role,
      });
      expect(result).toEqual({
        access_token: 'jwt-token',
        user: {
          id: user.id,
          companyId: user.companyId,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          lastLoginAt: expect.any(Date),
        },
      });
    });

    it('throws when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('throws when password does not match', async () => {
      prisma.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('throws when user is not active', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...user,
        status: UserStatus.INACTIVE,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('me', () => {
    it('returns the authenticated user', async () => {
      const user = {
        id: 'user-1',
        companyId: 'company-1',
        name: 'Admin',
        email: 'admin@acme.com',
        role: UserRole.COMPANY_ADMIN,
        status: UserStatus.ACTIVE,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.user.findUnique.mockResolvedValue(user);

      await expect(service.me('user-1')).resolves.toEqual(user);
    });

    it('throws when user is missing or inactive', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.me('user-1')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});
