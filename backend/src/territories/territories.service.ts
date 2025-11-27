import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTerritoryDto, UpdateTerritoryDto } from './dto';

@Injectable()
export class TerritoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createTerritoryDto: CreateTerritoryDto) {
    // Check if code already exists
    const existingTerritory = await this.prisma.territory.findUnique({
      where: { code: createTerritoryDto.code },
    });

    if (existingTerritory) {
      throw new ConflictException('Territory code already exists');
    }

    // Validate company exists
    const company = await this.prisma.company.findUnique({
      where: { id: createTerritoryDto.companyId },
    });

    if (!company) {
      throw new BadRequestException('Company not found');
    }

    // Create territory
    const territory = await this.prisma.territory.create({
      data: createTerritoryDto,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            users: true,
            customers: true,
          },
        },
      },
    });

    return territory;
  }

  async findAll(companyId?: string, isActive?: boolean) {
    const where: any = {};

    if (companyId) {
      where.companyId = companyId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const territories = await this.prisma.territory.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            users: true,
            customers: true,
          },
        },
      },
      orderBy: {
        code: 'asc',
      },
    });

    return territories;
  }

  async findOne(id: string) {
    const territory = await this.prisma.territory.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        users: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            isActive: true,
          },
          orderBy: {
            fullName: 'asc',
          },
        },
        customers: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
            isActive: true,
          },
          orderBy: {
            code: 'asc',
          },
        },
        _count: {
          select: {
            users: true,
            customers: true,
          },
        },
      },
    });

    if (!territory) {
      throw new NotFoundException(`Territory with ID ${id} not found`);
    }

    return territory;
  }

  async update(id: string, updateTerritoryDto: UpdateTerritoryDto) {
    // Check if territory exists
    const existingTerritory = await this.prisma.territory.findUnique({
      where: { id },
    });

    if (!existingTerritory) {
      throw new NotFoundException(`Territory with ID ${id} not found`);
    }

    // Check for code conflict (if being updated)
    if (updateTerritoryDto.code) {
      const conflictTerritory = await this.prisma.territory.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            { code: updateTerritoryDto.code },
          ],
        },
      });

      if (conflictTerritory) {
        throw new ConflictException('Territory code already exists');
      }
    }

    // Update territory
    const territory = await this.prisma.territory.update({
      where: { id },
      data: updateTerritoryDto,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            users: true,
            customers: true,
          },
        },
      },
    });

    return territory;
  }

  async remove(id: string) {
    // Check if territory exists
    const territory = await this.prisma.territory.findUnique({
      where: { id },
      include: {
        users: true,
        customers: true,
      },
    });

    if (!territory) {
      throw new NotFoundException(`Territory with ID ${id} not found`);
    }

    // Check if territory has users
    if (territory.users.length > 0) {
      throw new BadRequestException(
        'Cannot deactivate territory with assigned users. Please reassign users first.',
      );
    }

    // Check if territory has customers
    if (territory.customers.length > 0) {
      throw new BadRequestException(
        'Cannot deactivate territory with assigned customers. Please reassign customers first.',
      );
    }

    // Soft delete by setting isActive to false
    await this.prisma.territory.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Territory deactivated successfully' };
  }

  async activate(id: string) {
    const territory = await this.prisma.territory.findUnique({
      where: { id },
    });

    if (!territory) {
      throw new NotFoundException(`Territory with ID ${id} not found`);
    }

    await this.prisma.territory.update({
      where: { id },
      data: { isActive: true },
    });

    return { message: 'Territory activated successfully' };
  }

  async getStatistics(companyId: string) {
    const [
      totalTerritories,
      activeTerritories,
      totalUsersInTerritories,
      totalCustomersInTerritories,
    ] = await Promise.all([
      this.prisma.territory.count({ where: { companyId } }),
      this.prisma.territory.count({ where: { companyId, isActive: true } }),
      this.prisma.user.count({ where: { companyId, territoryId: { not: null } } }),
      this.prisma.customer.count({ where: { territory: { companyId }, territoryId: { not: null } } }),
    ]);

    return {
      totalTerritories,
      activeTerritories,
      inactiveTerritories: totalTerritories - activeTerritories,
      totalUsersInTerritories,
      totalCustomersInTerritories,
    };
  }
}
