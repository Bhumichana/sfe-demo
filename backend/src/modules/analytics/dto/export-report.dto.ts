import { IsNotEmpty, IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ExportFormat {
  PDF = 'PDF',
  CSV = 'CSV',
  EXCEL = 'EXCEL',
}

export class ExportReportDto {
  @ApiProperty({ enum: ExportFormat })
  @IsNotEmpty()
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  companyId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  territoryId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reportType?: string; // 'overview', 'call-metrics', 'coverage', etc.
}
