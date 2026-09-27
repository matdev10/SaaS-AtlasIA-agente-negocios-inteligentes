import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../generated/prisma/client';

import { TrainingService } from './training.service';

@Controller('documents')
@UseGuards(AuthGuard, RolesGuard)
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Roles(UserRole.COMPANY_ADMIN)
  @Post(':id/train')
  train(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.trainingService.trainDocument(id, user.companyId);
  }

  @Get(':id/training-jobs')
  listJobs(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.trainingService.listJobs(id, user.companyId);
  }
}
