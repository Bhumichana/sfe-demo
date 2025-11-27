import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateTerritoryDto } from './create-territory.dto';

export class UpdateTerritoryDto extends PartialType(
  OmitType(CreateTerritoryDto, ['companyId'] as const),
) {}
