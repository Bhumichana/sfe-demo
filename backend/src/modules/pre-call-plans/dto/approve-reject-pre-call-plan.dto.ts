import { IsString, IsOptional, IsUUID, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ApprovalAction {
  APPROVE = 'approve',
  REJECT = 'reject',
}

export class ApproveRejectPreCallPlanDto {
  @ApiProperty({ enum: ApprovalAction, description: 'Approval action' })
  @IsEnum(ApprovalAction)
  @IsNotEmpty()
  action: ApprovalAction;

  @ApiProperty({ description: 'Manager/Approver ID' })
  @IsUUID()
  @IsNotEmpty()
  approverId: string;

  @ApiPropertyOptional({ description: 'Rejection reason or approval comments' })
  @IsString()
  @IsOptional()
  reason?: string;
}
