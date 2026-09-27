import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { PublicWidgetChatDto } from './dto/public-widget-chat.dto';
import { WidgetsService } from './widgets.service';

@Controller('public/widgets')
export class PublicWidgetsController {
  constructor(private readonly widgetsService: WidgetsService) {}

  @Get(':widgetId')
  getPublicConfig(@Param('widgetId') widgetId: string) {
    return this.widgetsService.getPublicConfig(widgetId);
  }

  @Post(':widgetId/chat')
  publicChat(
    @Param('widgetId') widgetId: string,
    @Body() publicWidgetChatDto: PublicWidgetChatDto,
  ) {
    return this.widgetsService.publicChat(widgetId, publicWidgetChatDto);
  }
}
