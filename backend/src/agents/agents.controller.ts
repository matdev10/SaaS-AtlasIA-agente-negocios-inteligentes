import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../generated/prisma/client';

import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@Controller('agents')
@UseGuards(AuthGuard, RolesGuard)
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Roles(UserRole.COMPANY_ADMIN)
  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body() createAgentDto: CreateAgentDto,
  ) {
    return this.agentsService.create(user.companyId, createAgentDto);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.agentsService.findAll(user.companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.agentsService.findOne(id, user.companyId);
  }

  @Roles(UserRole.COMPANY_ADMIN)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() updateAgentDto: UpdateAgentDto,
  ) {
    return this.agentsService.update(id, user.companyId, updateAgentDto);
  }

  @Roles(UserRole.COMPANY_ADMIN)
  @Delete(':id')
  archive(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.agentsService.archive(id, user.companyId);
  }
}
