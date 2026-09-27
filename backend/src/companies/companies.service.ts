import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async findMine(companyId: string) {
    const company = await this.prisma.company.findFirst({
      where: {
        id: companyId,
        status: {
          not: 'ARCHIVED',
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Empresa no encontrada');
    }

    return company;
  }

  async updateMine(companyId: string, data: UpdateCompanyDto) {
    await this.findMine(companyId);

    return this.prisma.company.update({
      where: { id: companyId },
      data,
    });
  }
}
