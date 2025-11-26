import { PartialType } from '@nestjs/swagger';
import { CreatePreCallPlanDto } from './create-pre-call-plan.dto';

export class UpdatePreCallPlanDto extends PartialType(CreatePreCallPlanDto) {}
