import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../generated/prisma/client';

import { CompaniesService } from './companies.service';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Controller('companies')
@UseGuards(AuthGuard, RolesGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('me')
  findMine(@CurrentUser() user: JwtPayload) {
    return this.companiesService.findMine(user.companyId);
  }

  @Roles(UserRole.COMPANY_ADMIN)
  @Patch('me')
  updateMine(
    @CurrentUser() user: JwtPayload,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    return this.companiesService.updateMine(user.companyId, updateCompanyDto);
  }
}
