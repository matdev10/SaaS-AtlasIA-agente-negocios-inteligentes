import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCompanyDto) {
    return this.prisma.company.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.company.findMany({
      where: {
        status: {
          not: 'ARCHIVED',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findArchived() {
    return this.prisma.company.findMany({
      where: {
        status: 'ARCHIVED',
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException('Empresa no encontrada');
    }

    return company;
  }

  async update(id: string, data: UpdateCompanyDto) {
    await this.findOne(id);
    return this.prisma.company.update({
      where: { id },
      data,
    });
  }

  async archive(id: string) {
    await this.findOne(id);
    return this.prisma.company.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
      },
    });
  }

  async restore(id: string) {
    await this.findOne(id);
    return this.prisma.company.update({
      where: { id },
      data: {
        status: 'ACTIVE',
      },
    });
  }

}