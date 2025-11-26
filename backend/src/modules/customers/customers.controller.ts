import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerType } from '@prisma/client';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  create(@Body() createCustomerDto: CreateCustomerDto, @Request() req) {
    // Set createdBy from authenticated user (if available)
    if (req.user?.userId) {
      createCustomerDto.createdBy = req.user.userId;
    } else {
      // Default to demo user if not authenticated (for testing)
      createCustomerDto.createdBy = '8e8a0bb6-2ac7-41b5-99a3-d249ddd51e02';
    }
    return this.customersService.create(createCustomerDto);
  }

  @Get()
  findAll(
    @Query('territoryId') territoryId?: string,
    @Query('type') type?: CustomerType,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    const isActiveBoolean = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.customersService.findAll(territoryId, type, search, isActiveBoolean);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto, @Request() req) {
    const userId = req.user?.userId || 'system';
    return this.customersService.update(id, userId, updateCustomerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    const userId = req.user?.userId || 'system';
    return this.customersService.remove(id, userId);
  }
}
