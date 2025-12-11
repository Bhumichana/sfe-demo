import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../modules/auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.CEO)
  @ApiOperation({ summary: 'Create a new user (CEO only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'Username or email already exists' })
  @ApiResponse({ status: 403, description: 'Only CEO can create users' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users with optional filters' })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'territoryId', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Returns list of users' })
  findAll(
    @Query('companyId') companyId?: string,
    @Query('role') role?: string,
    @Query('territoryId') territoryId?: string,
    @Query('isActive') isActive?: string,
  ) {
    const isActiveBoolean = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.usersService.findAll(companyId, role, territoryId, isActiveBoolean);
  }

  @Get('statistics/:companyId')
  @ApiOperation({ summary: 'Get user statistics for a company' })
  @ApiResponse({ status: 200, description: 'Returns user statistics' })
  getStatistics(@Param('companyId') companyId: string) {
    return this.usersService.getStatistics(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'Returns user details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.CEO)
  @ApiOperation({ summary: 'Update user (CEO only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Username or email already exists' })
  @ApiResponse({ status: 403, description: 'Only CEO can update users' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    console.log('📝 Update User Request:', { id, body: updateUserDto });
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.CEO)
  @ApiOperation({ summary: 'Deactivate user (soft delete, CEO only)' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Only CEO can delete users' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Delete(':id/hard')
  @Roles(UserRole.CEO)
  @ApiOperation({ summary: 'Permanently delete user (CEO only)' })
  @ApiResponse({ status: 200, description: 'User permanently deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Only CEO can permanently delete users' })
  hardDelete(@Param('id') id: string) {
    return this.usersService.hardDelete(id);
  }

  @Post(':id/activate')
  @Roles(UserRole.CEO)
  @ApiOperation({ summary: 'Activate user (CEO only)' })
  @ApiResponse({ status: 200, description: 'User activated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Only CEO can activate users' })
  activate(@Param('id') id: string) {
    return this.usersService.activate(id);
  }
}
