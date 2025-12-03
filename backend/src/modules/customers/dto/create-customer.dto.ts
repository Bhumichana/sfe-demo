import { IsString, IsEnum, IsOptional, IsNumber, IsDecimal } from 'class-validator';
import { CustomerType } from '@prisma/client';

export class CreateCustomerDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsString()
  name: string;

  // type is auto-calculated from monthlyRevenue (not required in request)

  @IsOptional()
  @IsNumber()
  monthlyRevenue?: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  territoryId?: string;

  @IsOptional()
  @IsNumber()
  requiredVisitsPerMonth?: number;

  @IsOptional()
  @IsNumber()
  responseTimeHours?: number;

  @IsOptional()
  @IsString()
  createdBy?: string; // User ID (set by controller from authenticated user)

  // Quick Create: Create contact at the same time
  @IsOptional()
  contact?: {
    name: string;
    position?: string;
    phone?: string;
    email?: string;
  };
}
