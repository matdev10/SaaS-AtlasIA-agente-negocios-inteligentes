import { Controller, Get, Header, Query, StreamableFile, UseGuards } from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { RolesGuard } from '../auth/roles.guard';

import { ListLeadsQueryDto } from './dto/list-leads-query.dto';
import { LeadsService } from './leads.service';

@Controller('leads')
@UseGuards(AuthGuard, RolesGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get('export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async export(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListLeadsQueryDto,
  ) {
    const csv = await this.leadsService.exportCsv(user.companyId, query.agentId);
    return new StreamableFile(Buffer.from(csv, 'utf8'), {
      type: 'text/csv; charset=utf-8',
      disposition: 'attachment; filename="prospectos.csv"',
    });
  }

  @Get()
  list(@CurrentUser() user: JwtPayload, @Query() query: ListLeadsQueryDto) {
    return this.leadsService.list(user.companyId, query.agentId);
  }
}
