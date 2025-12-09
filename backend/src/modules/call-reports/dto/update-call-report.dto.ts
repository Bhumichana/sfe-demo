import { IsOptional, IsString, IsEnum, IsArray, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CallActivityType } from '@prisma/client';

export class UpdateCallReportDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  checkInTime?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  checkInLat?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  checkInLng?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  checkOutTime?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  checkOutLat?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  checkOutLng?: number;

  @ApiProperty({ required: false, enum: CallActivityType })
  @IsOptional()
  @IsEnum(CallActivityType)
  callActivityType?: CallActivityType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  activitiesDone?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customerResponse?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customerRequest?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customerObjections?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customerNeeds?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customerComplaints?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nextAction?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  durationMinutes?: number;
}
