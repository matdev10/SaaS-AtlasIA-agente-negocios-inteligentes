import { Body, Controller, Headers, Param, Patch, Post } from '@nestjs/common';

import { CreatePublicLeadDto } from './dto/create-public-lead.dto';
import { UpdatePublicLeadDto } from './dto/update-public-lead.dto';
import { LeadsService } from './leads.service';

@Controller('public/widgets')
export class PublicLeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post(':widgetId/leads')
  create(
    @Param('widgetId') widgetId: string,
    @Body() dto: CreatePublicLeadDto,
    @Headers('origin') origin?: string,
    @Headers('referer') referer?: string,
  ) {
    return this.leadsService.createPublic(widgetId, dto, origin || referer);
  }

  @Patch(':widgetId/leads/:leadId')
  update(
    @Param('widgetId') widgetId: string,
    @Param('leadId') leadId: string,
    @Body() dto: UpdatePublicLeadDto,
    @Headers('origin') origin?: string,
    @Headers('referer') referer?: string,
  ) {
    return this.leadsService.updatePublic(
      widgetId,
      leadId,
      dto,
      origin || referer,
    );
  }
}
