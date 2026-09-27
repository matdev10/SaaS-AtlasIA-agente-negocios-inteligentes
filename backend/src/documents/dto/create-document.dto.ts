import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';

import { DocumentType } from '../../generated/prisma/client';

export class CreateDocumentDto {
  @IsUUID()
  agentId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsEnum(DocumentType)
  type: DocumentType;

  @IsOptional()
  @IsUrl()
  sourceUrl?: string;

  @ValidateIf((dto: CreateDocumentDto) => !dto.sourceUrl)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100_000)
  extractedText?: string;
}
