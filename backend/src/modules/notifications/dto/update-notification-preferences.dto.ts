import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  planApproved?: boolean;

  @IsOptional()
  @IsBoolean()
  planRejected?: boolean;

  @IsOptional()
  @IsBoolean()
  planPending?: boolean;

  @IsOptional()
  @IsBoolean()
  reminder?: boolean;

  @IsOptional()
  @IsBoolean()
  coaching?: boolean;

  @IsOptional()
  @IsBoolean()
  system?: boolean;

  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  soundEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  vibrationEnabled?: boolean;
}
