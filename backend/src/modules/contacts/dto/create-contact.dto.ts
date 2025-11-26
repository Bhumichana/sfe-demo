import { IsString, IsOptional, IsBoolean, IsEmail } from 'class-validator';

export class CreateContactDto {
  @IsString()
  customerId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  lineId?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
