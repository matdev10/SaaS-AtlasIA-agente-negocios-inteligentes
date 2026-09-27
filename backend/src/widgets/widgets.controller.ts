import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../generated/prisma/client';

import { UpsertWidgetDto } from './dto/upsert-widget.dto';
import { WidgetsService } from './widgets.service';

@Controller('agents/:agentId/widget')
@UseGuards(AuthGuard, RolesGuard)
export class WidgetsController {
  constructor(private readonly widgetsService: WidgetsService) {}

  @Get()
  getByAgent(
    @Param('agentId') agentId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.widgetsService.getByAgent(agentId, user.companyId);
  }

  @Roles(UserRole.COMPANY_ADMIN)
  @Put()
  upsertByAgent(
    @Param('agentId') agentId: string,
    @CurrentUser() user: JwtPayload,
    @Body() upsertWidgetDto: UpsertWidgetDto,
  ) {
    return this.widgetsService.upsertByAgent(
      agentId,
      user.companyId,
      upsertWidgetDto,
    );
  }
}
