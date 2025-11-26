import { IsNotEmpty, IsString, IsOptional, IsEnum, IsBoolean, IsArray, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CallActivityType } from '@prisma/client';

export class CreateCallReportDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  preCallPlanId?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  srId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  customerId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  contactId: string;

  @ApiProperty({ example: '2025-01-15' })
  @IsNotEmpty()
  @IsDateString()
  callDate: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  checkInTime?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  checkInLat?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  checkInLng?: number;

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
  @IsBoolean()
  isPlanned?: boolean;
}
