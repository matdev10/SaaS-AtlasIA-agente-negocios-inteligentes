import { IsEnum, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

import { DocumentStatus, DocumentType } from '../../generated/prisma/client';

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;

  @IsOptional()
  @IsUrl()
  sourceUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100_000)
  extractedText?: string;

  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;
}
