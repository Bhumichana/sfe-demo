import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseBoolPipe,
} from '@nestjs/common';
import { ActivityTypesService } from './activity-types.service';
import { CreateActivityTypeDto } from './dto/create-activity-type.dto';
import { UpdateActivityTypeDto } from './dto/update-activity-type.dto';

@Controller('activity-types')
export class ActivityTypesController {
  constructor(private readonly activityTypesService: ActivityTypesService) {}

  @Post()
  create(@Body() createActivityTypeDto: CreateActivityTypeDto) {
    return this.activityTypesService.create(createActivityTypeDto);
  }

  @Get()
  findAll(@Query('activeOnly', new ParseBoolPipe({ optional: true })) activeOnly?: boolean) {
    return this.activityTypesService.findAll(activeOnly);
  }

  @Get('seed')
  seed() {
    return this.activityTypesService.seedDefaultActivities();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.activityTypesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateActivityTypeDto: UpdateActivityTypeDto) {
    return this.activityTypesService.update(id, updateActivityTypeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.activityTypesService.remove(id);
  }
}
