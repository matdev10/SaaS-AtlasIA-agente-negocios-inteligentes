import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../generated/prisma/client';

import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Controller('documents')
@UseGuards(AuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Roles(UserRole.COMPANY_ADMIN)
  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body() createDocumentDto: CreateDocumentDto,
  ) {
    return this.documentsService.create(user.companyId, createDocumentDto);
  }

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('agentId') agentId: string,
  ) {
    if (!agentId) {
      throw new BadRequestException('Query agentId es requerido');
    }

    return this.documentsService.findAllByAgent(agentId, user.companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.documentsService.findOne(id, user.companyId);
  }

  @Roles(UserRole.COMPANY_ADMIN)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(
      id,
      user.companyId,
      updateDocumentDto,
    );
  }

  @Roles(UserRole.COMPANY_ADMIN)
  @Delete(':id')
  archive(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.documentsService.archive(id, user.companyId);
  }
}
