import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../database/prisma.service';
import {
  Prisma,
  UserRole,
  UserStatus,
} from '../generated/prisma/client';
import { FREE_PLAN } from './constants/free-plan';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(data: RegisterDto) {
    const email = data.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('El correo ya está registrado');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const lastLoginAt = new Date();

    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const plan = await tx.plan.upsert({
          where: { name: FREE_PLAN.name },
          create: {
            name: FREE_PLAN.name,
            price: FREE_PLAN.price,
            maxUsers: FREE_PLAN.maxUsers,
            maxAgents: FREE_PLAN.maxAgents,
            maxDocuments: FREE_PLAN.maxDocuments,
            maxConversations: FREE_PLAN.maxConversations,
            maxAiTokens: FREE_PLAN.maxAiTokens,
            includesRag: FREE_PLAN.includesRag,
            includesWidget: FREE_PLAN.includesWidget,
          },
          update: {},
        });

        const company = await tx.company.create({
          data: {
            name: data.companyName,
            contactEmail: email,
            status: 'TRIAL',
          },
        });

        const createdUser = await tx.user.create({
          data: {
            companyId: company.id,
            name: data.adminName,
            email,
            passwordHash,
            role: UserRole.COMPANY_ADMIN,
            status: UserStatus.ACTIVE,
            lastLoginAt,
          },
        });

        await tx.subscription.create({
          data: {
            companyId: company.id,
            planId: plan.id,
            status: 'TRIAL',
          },
        });

        await tx.agent.create({
          data: {
            companyId: company.id,
            name: 'Agente principal',
            status: 'DRAFT',
            knowledgeBase: {
              create: {
                name: 'Base de conocimiento principal',
              },
            },
          },
        });

        return createdUser;
      });

      return this.buildAuthResponse(user, lastLoginAt);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('El correo ya está registrado');
      }

      throw error;
    }
  }

  async login(data: LoginDto) {
    const email = data.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordMatches = await bcrypt.compare(
      data.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Usuario no activo');
    }

    const lastLoginAt = new Date();

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt },
    });

    return this.buildAuthResponse(user, lastLoginAt);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        companyId: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Usuario no activo');
    }

    return user;
  }

  private async buildAuthResponse(
    user: {
      id: string;
      companyId: string;
      name: string;
      email: string;
      role: UserRole;
      status: UserStatus;
    },
    lastLoginAt: Date,
  ) {
    const payload: JwtPayload = {
      sub: user.id,
      companyId: user.companyId,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      access_token: accessToken,
      user: {
        id: user.id,
        companyId: user.companyId,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        lastLoginAt,
      },
    };
  }
}
